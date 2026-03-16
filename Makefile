COMPOSE=docker compose --env-file ./infra/docker/.env.docker

.PHONY: up down logs ps observability smoke

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f api

ps:
	$(COMPOSE) ps

observability:
	@echo "Grafana: http://localhost:3002"
	@echo "Prometheus: http://localhost:9090"
	@echo "Jaeger: http://localhost:16686"

smoke:
	@echo "API health -> http://localhost:3001/health"
	@echo "Prometheus targets -> http://localhost:9090/targets"
	@echo "Grafana health -> http://localhost:3002/api/health"
	@echo "Jaeger UI -> http://localhost:16686"
