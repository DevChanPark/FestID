#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKDIR="${OPENDID_WORKDIR:-$BACKEND_DIR/.opendid}"
ISSUER_SOURCE="$WORKDIR/did-issuer-server/source"
VERIFIER_SOURCE="$WORKDIR/did-verifier-server/source"
BUILD_DOCKERFILE_DIR="$WORKDIR/build/dockerfiles"
JDK_IMAGE="${OPENDID_JDK_IMAGE:-eclipse-temurin:21-jdk-jammy}"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required." >&2
    exit 1
  fi
}

require_dir() {
  local path="$1"
  local message="$2"
  if [ ! -d "$path" ]; then
    echo "$message" >&2
    echo "Run: npm run opendid:clone" >&2
    exit 1
  fi
}

require_file() {
  local path="$1"
  local message="$2"
  if [ ! -f "$path" ]; then
    echo "$message" >&2
    exit 1
  fi
}

require_command docker
require_dir "$ISSUER_SOURCE" "Issuer source directory was not found."
require_dir "$VERIFIER_SOURCE" "Verifier source directory was not found."
require_file "$ISSUER_SOURCE/Dockerfile" "Issuer Dockerfile was not found."
require_file "$VERIFIER_SOURCE/Dockerfile" "Verifier Dockerfile was not found."

render_dockerfile() {
  local source_dockerfile="$1"
  local target_dockerfile="$2"

  mkdir -p "$(dirname "$target_dockerfile")"
  awk -v jdk_image="$JDK_IMAGE" '
    NR == 1 && $1 == "FROM" {
      print "FROM " jdk_image
      next
    }
    { print }
  ' "$source_dockerfile" > "$target_dockerfile"
}

ISSUER_DOCKERFILE="$BUILD_DOCKERFILE_DIR/Dockerfile.issuer"
VERIFIER_DOCKERFILE="$BUILD_DOCKERFILE_DIR/Dockerfile.verifier"

echo "Rendering OpenDID Dockerfiles with base image: $JDK_IMAGE"
render_dockerfile "$ISSUER_SOURCE/Dockerfile" "$ISSUER_DOCKERFILE"
render_dockerfile "$VERIFIER_SOURCE/Dockerfile" "$VERIFIER_DOCKERFILE"

echo "Building did-issuer-server image..."
docker build -t did-issuer-server -f "$ISSUER_DOCKERFILE" "$ISSUER_SOURCE"

echo "Building did-verifier-server image..."
docker build -t did-verifier-server -f "$VERIFIER_DOCKERFILE" "$VERIFIER_SOURCE"

echo "OpenDID Docker images built."
