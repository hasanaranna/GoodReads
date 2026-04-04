#!/usr/bin/env bash
# Run with strict mode:
# -e: stop on error
# -u: fail on unset variable usage
# -o pipefail: fail pipeline if any command fails
set -euo pipefail

# Resolve project root from this script location and execute from root.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# Pick compose command compatible with the current machine.
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Error: neither docker compose nor docker-compose is available."
  exit 1
fi

# Create .env from template if missing.
ensure_env_file() {
  if [[ ! -f .env ]]; then
    cp .env.example .env
    echo "Created .env from .env.example. Update secrets before using in production."
  fi
}

# Build and start services. Includes a recovery path for compose v1 recreate failures.
run_up() {
  ensure_env_file
  # First attempt: normal detached startup.
  if ! "${COMPOSE_CMD[@]}" up -d --build --remove-orphans; then
    echo "Compose up failed. Running recovery (down + up)."
    # Recovery attempt: clean runtime state and retry once.
    "${COMPOSE_CMD[@]}" down || true
    "${COMPOSE_CMD[@]}" up -d --build --remove-orphans
  fi
  # Show status and quick access URLs.
  "${COMPOSE_CMD[@]}" ps
  echo "Frontend: http://localhost:5173"
  echo "Backend:  http://localhost:8080"
}

# Stop and remove compose resources for this project.
run_down() {
  "${COMPOSE_CMD[@]}" down
}

# Stream logs from all services.
run_logs() {
  "${COMPOSE_CMD[@]}" logs -f
}

# Print current service state.
run_status() {
  "${COMPOSE_CMD[@]}" ps
}

# Restart by doing a full down then up.
run_restart() {
  run_down
  run_up
}

# Print usage information.
print_help() {
  cat <<'EOF'
Usage:
  ./scripts/local/run-project.sh up
  ./scripts/local/run-project.sh down
  ./scripts/local/run-project.sh restart
  ./scripts/local/run-project.sh logs
  ./scripts/local/run-project.sh status

Commands:
  up       Build images and start all services in detached mode.
  down     Stop and remove containers and network.
  restart  Recreate everything using down then up.
  logs     Follow logs from all services.
  status   Show container status.
EOF
}

# Default command is "up" when no argument is provided.
COMMAND="${1:-up}"

# Dispatch command to corresponding function.
case "$COMMAND" in
  up) run_up ;;
  down) run_down ;;
  restart) run_restart ;;
  logs) run_logs ;;
  status) run_status ;;
  help|-h|--help) print_help ;;
  *)
    echo "Unknown command: $COMMAND"
    print_help
    exit 1
    ;;
esac
