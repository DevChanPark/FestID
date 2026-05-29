#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKDIR="${OPENDID_WORKDIR:-$BACKEND_DIR/.opendid}"
BRANCH="${OPENDID_BRANCH:-develop}"

COMPONENTS=(
  "did-issuer-server"
  "did-verifier-server"
)

mkdir -p "$WORKDIR"

for component in "${COMPONENTS[@]}"; do
  repo_url="https://github.com/OmniOneID/${component}.git"
  target_dir="$WORKDIR/$component"

  if [ -d "$target_dir/.git" ]; then
    echo "Updating $component in $target_dir"
    git -C "$target_dir" fetch --depth=1 origin "$BRANCH"
    git -C "$target_dir" checkout "$BRANCH"
    git -C "$target_dir" reset --hard "origin/$BRANCH"
  else
    echo "Cloning $component into $target_dir"
    git clone --depth=1 --branch "$BRANCH" "$repo_url" "$target_dir"
  fi
done

cat <<EOF

OpenDID components are ready under:
  $WORKDIR

Issuer server source:
  $WORKDIR/did-issuer-server/source/did-issuer-server

Verifier server source:
  $WORKDIR/did-verifier-server/source/did-verifier-server

Next:
  1. Read backend/docs/opendid-self-hosted-runbook.md
  2. Configure each server's source/*/src/main/resources/config files
  3. Build official Docker images or run with Gradle
  4. Set OPENDID_ISSUER_BASE_URL and OPENDID_VERIFIER_BASE_URL in backend/.env
EOF
