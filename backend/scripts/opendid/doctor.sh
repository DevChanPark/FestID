#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKDIR="${OPENDID_WORKDIR:-$BACKEND_DIR/.opendid}"
COMPOSE_DIR="${OPENDID_COMPOSE_DIR:-$WORKDIR/compose}"

ERRORS=0
WARNINGS=0

ok() {
  printf "OK   %s\n" "$1"
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  printf "WARN %s\n" "$1"
}

fail() {
  ERRORS=$((ERRORS + 1))
  printf "FAIL %s\n" "$1"
}

check_command() {
  local command_name="$1"
  local label="$2"
  if command -v "$command_name" >/dev/null 2>&1; then
    ok "$label: $(command -v "$command_name")"
  else
    fail "$label is not installed or not on PATH."
  fi
}

check_file() {
  local path="$1"
  local label="$2"
  if [ -f "$path" ]; then
    ok "$label: $path"
  else
    fail "$label missing: $path"
  fi
}

check_dir() {
  local path="$1"
  local label="$2"
  if [ -d "$path" ]; then
    ok "$label: $path"
  else
    fail "$label missing: $path"
  fi
}

docker_compose_available() {
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

check_docker_image() {
  local image_name="$1"
  if ! command -v docker >/dev/null 2>&1; then
    return
  fi

  if docker image inspect "$image_name" >/dev/null 2>&1; then
    ok "Docker image exists: $image_name"
  else
    warn "Docker image not built yet: $image_name"
  fi
}

check_config_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if [ ! -f "$file" ]; then
    return
  fi

  if grep -q "$pattern" "$file"; then
    ok "$label"
  else
    warn "$label not found in $file"
  fi
}

echo "CamPass OpenDID self-host doctor"
echo

check_command git "Git"
check_command java "Java"
check_command docker "Docker"

if command -v docker >/dev/null 2>&1; then
  if docker_compose_available; then
    ok "Docker Compose is available."
  else
    fail "Docker Compose is not available."
  fi
fi

echo
check_dir "$WORKDIR/did-issuer-server/.git" "Official issuer repository"
check_dir "$WORKDIR/did-verifier-server/.git" "Official verifier repository"
check_file "$WORKDIR/did-issuer-server/source/Dockerfile" "Issuer Dockerfile"
check_file "$WORKDIR/did-verifier-server/source/Dockerfile" "Verifier Dockerfile"

echo
check_file "$COMPOSE_DIR/docker-compose.yml" "Compose file"
check_dir "$COMPOSE_DIR/issuer-config" "Issuer config directory"
check_dir "$COMPOSE_DIR/verifier-config" "Verifier config directory"
check_file "$COMPOSE_DIR/issuer-config/application.yml" "Issuer application.yml"
check_file "$COMPOSE_DIR/issuer-config/application-database.yml" "Issuer database config"
check_file "$COMPOSE_DIR/verifier-config/application.yml" "Verifier application.yml"

echo
check_config_contains \
  "$COMPOSE_DIR/issuer-config/application.yml" \
  "active: dev" \
  "Issuer profile patched to dev"
check_config_contains \
  "$COMPOSE_DIR/verifier-config/application.yml" \
  "active: dev" \
  "Verifier profile patched to dev"
check_config_contains \
  "$COMPOSE_DIR/issuer-config/application-database.yml" \
  "opendid-issuer-db" \
  "Issuer DB points to compose service"
check_config_contains \
  "$COMPOSE_DIR/verifier-config/application.yml" \
  "opendid-verifier-db" \
  "Verifier DB points to compose service"

echo
if [ -f "$COMPOSE_DIR/issuer-config/issuer.wallet" ]; then
  ok "Issuer wallet file exists."
else
  warn "Issuer wallet file missing: $COMPOSE_DIR/issuer-config/issuer.wallet"
fi

if [ -f "$COMPOSE_DIR/verifier-config/verifier.wallet" ]; then
  ok "Verifier wallet file exists."
else
  warn "Verifier wallet file missing: $COMPOSE_DIR/verifier-config/verifier.wallet"
fi

check_docker_image did-issuer-server
check_docker_image did-verifier-server

echo
echo "Doctor summary: $ERRORS error(s), $WARNINGS warning(s)."

if [ "$ERRORS" -gt 0 ]; then
  exit 1
fi
