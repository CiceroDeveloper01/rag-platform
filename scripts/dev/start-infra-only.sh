#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but was not found in PATH."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required but is not available."
  exit 1
fi

mapfile -t available_services < <(docker compose config --services)

service_exists() {
  local target="$1"
  local service

  for service in "${available_services[@]}"; do
    if [[ "$service" == "$target" ]]; then
      return 0
    fi
  done

  return 1
}

collect_existing_services() {
  local result=()
  local candidate

  for candidate in "$@"; do
    if service_exists "$candidate"; then
      result+=("$candidate")
    fi
  done

  printf '%s\n' "${result[@]}"
}

mapfile -t app_services < <(
  collect_existing_services \
    web \
    api-web \
    api-business \
    api \
    orchestrator
)

mapfile -t infra_services < <(
  collect_existing_services \
    postgres \
    redis \
    rabbitmq \
    grafana \
    prometheus \
    loki \
    tempo \
    otel-collector \
    promtail
)

if ((${#app_services[@]} > 0)); then
  echo "Stopping app containers: ${app_services[*]}"
  docker compose stop "${app_services[@]}"
else
  echo "No app services found to stop."
fi

if ((${#infra_services[@]} > 0)); then
  echo "Starting infrastructure containers only: ${infra_services[*]}"
  docker compose up -d --no-deps "${infra_services[@]}"
else
  echo "No infrastructure services found to start."
fi

echo
echo "Active containers:"
docker ps
