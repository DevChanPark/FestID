#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKDIR="${OPENDID_WORKDIR:-$BACKEND_DIR/.opendid}"
COMPOSE_DIR="${OPENDID_COMPOSE_DIR:-$WORKDIR/compose}"
ACTION="${1:-up}"
CONFIG_COPY_IMAGE="${OPENDID_CONFIG_COPY_IMAGE:-alpine:3.20}"
ISSUER_CONFIG_VOLUME="${OPENDID_ISSUER_CONFIG_VOLUME:-campass_opendid_issuer_config}"
VERIFIER_CONFIG_VOLUME="${OPENDID_VERIFIER_CONFIG_VOLUME:-campass_opendid_verifier_config}"

require_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "Required file missing: $path" >&2
    echo "Run: npm run opendid:prepare && npm run opendid:patch-local" >&2
    exit 1
  fi
}

require_dir() {
  local path="$1"
  if [ ! -d "$path" ]; then
    echo "Required directory missing: $path" >&2
    echo "Run: npm run opendid:prepare && npm run opendid:patch-local" >&2
    exit 1
  fi
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
    return
  fi

  echo "Docker Compose is required." >&2
  exit 1
}

sync_config_volume() {
  local source_dir="$1"
  local volume_name="$2"
  local label="$3"

  require_dir "$source_dir"
  docker volume create "$volume_name" >/dev/null

  echo "Syncing $label config into Docker volume: $volume_name"
  docker run --rm \
    -v "$source_dir:/src:ro" \
    -v "$volume_name:/dest" \
    "$CONFIG_COPY_IMAGE" \
    sh -c 'find /dest -mindepth 1 -maxdepth 1 -exec rm -rf {} + && cp -a /src/. /dest/'
}

sync_config_volumes() {
  sync_config_volume "$COMPOSE_DIR/issuer-config" "$ISSUER_CONFIG_VOLUME" "issuer"
  sync_config_volume "$COMPOSE_DIR/verifier-config" "$VERIFIER_CONFIG_VOLUME" "verifier"
}

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required." >&2
  exit 1
fi

require_file "$COMPOSE_DIR/docker-compose.yml"
cd "$COMPOSE_DIR"

case "$ACTION" in
  up)
    sync_config_volumes
    compose_cmd up -d
    ;;
  down)
    compose_cmd down
    ;;
  restart)
    compose_cmd down
    sync_config_volumes
    compose_cmd up -d
    ;;
  logs)
    compose_cmd logs -f
    ;;
  ps)
    compose_cmd ps
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    echo "Usage: $0 {up|down|restart|logs|ps}" >&2
    exit 1
    ;;
esac
