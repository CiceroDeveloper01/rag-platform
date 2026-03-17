# Deployment Guide

This repository uses two infrastructure modes on purpose:

- Docker Compose for local development
- Kubernetes manifests for shared deployment environments

The architecture and app boundaries remain the same in both modes:

- `apps/web`
- `apps/api-web`
- `apps/api-business`
- `apps/orchestrator`

## Local Standard: Docker Compose

Docker Compose remains the default local developer workflow.

Use it for:

- PostgreSQL
- Redis
- RabbitMQ
- Grafana
- Prometheus
- Loki
- Tempo
- OpenTelemetry Collector

For infra-only local development:

```bash
npm run dev:infra
```

For the full containerized stack:

```bash
docker compose --env-file ./infra/docker/.env.docker up -d --build
```

## Deployment Target: Kubernetes

Kubernetes assets live under:

```text
k8s/
  base/
  overlays/
    dev/
    staging/
    prod/
```

The Kubernetes manifests prepare:

- Deployments
- Services
- Ingress
- ConfigMap
- Secret example
- HorizontalPodAutoscalers

The manifests cover only application workloads. They do not try to own every
infrastructure dependency inside the chart or manifest tree.

See:

- [Kubernetes Guide](KUBERNETES.md)

## Exposure Boundaries

Expected exposure model:

- `web`
  - external through Ingress
- `api-web`
  - external through Ingress
- `api-business`
  - internal ClusterIP only
- `orchestrator`
  - internal ClusterIP only
- RabbitMQ
  - internal dependency only

## RabbitMQ Strategy

RabbitMQ stays local through Docker Compose for development.

In Kubernetes, the applications are configured through environment variables so
they can use:

- an externally managed RabbitMQ instance
- a RabbitMQ deployment managed outside this repository
- another cluster-local RabbitMQ service provided by the platform team

The application manifests do not hardcode a local-only broker assumption.

## Image Build Readiness

The repository ships production-oriented Dockerfiles for:

- `apps/web`
- `apps/api-web`
- `apps/api-business`
- `apps/orchestrator`

Root convenience commands:

```bash
npm run docker:build:web
npm run docker:build:api-web
npm run docker:build:api
npm run docker:build:orchestrator
```

## Validation

Useful root-level checks:

```bash
docker compose config
npm run k8s:render:base
npm run k8s:render:dev
npm run k8s:render:staging
npm run k8s:render:prod
```
