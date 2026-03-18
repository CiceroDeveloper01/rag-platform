# Kubernetes Guide

This guide explains the Kubernetes deployment structure prepared in this
repository.

It does not replace Docker Compose for local development.

## Purpose

The `k8s/` tree prepares the monorepo for cluster deployment while preserving
the current application boundaries:

- `web`
- `api-web`
- `api-business`
- `orchestrator`

## Structure

```text
k8s/
  base/
    configmap.yaml
    secret.example.yaml
    web-deployment.yaml
    web-service.yaml
    api-web-deployment.yaml
    api-web-service.yaml
    api-business-deployment.yaml
    api-business-service.yaml
    orchestrator-deployment.yaml
    orchestrator-service.yaml
    api-web-hpa.yaml
    api-business-hpa.yaml
    orchestrator-hpa.yaml
    ingress.yaml
  overlays/
    dev/
    staging/
    prod/
```

Each overlay owns its target namespace manifest.

## Base vs Overlays

### Base

`k8s/base` contains the shared deployment model:

- app Deployments
- Services
- ConfigMap
- Secret placeholder
- Ingress
- HPAs

### Overlays

`k8s/overlays` adjusts:

- namespace
- ingress hostnames
- lower replica counts for development

## Services

### External

- `rag-web`
- `rag-api-web`

These are routed through Ingress.

### Internal

- `rag-api-business`
- `rag-orchestrator`

These remain cluster-internal services.

## Config Strategy

### ConfigMap

Non-sensitive runtime configuration is kept in:

- `k8s/base/configmap.yaml`

Examples:

- ports
- feature-safe runtime defaults
- RabbitMQ queue/exchange names
- internal service base URLs
- OTEL endpoint

### Secret

Sensitive values are represented only as placeholders in:

- `k8s/base/secret.example.yaml`

Replace these with real secret management before deployment. The example secret
is not applied automatically by the base Kustomization.

## RabbitMQ

RabbitMQ is treated differently across environments:

### Local

- runs in Docker Compose
- management UI stays available at `http://localhost:15672`

### Kubernetes

The apps connect through environment variables such as:

- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASS`
- `RABBITMQ_VHOST`

This allows Kubernetes environments to use:

- an external managed RabbitMQ
- a separately deployed in-cluster RabbitMQ

The repository does not embed a RabbitMQ operator or stateful manifest by
default.

## Probes

The manifests use the existing runtime endpoints:

- `web`
  - `GET /`
- `api-web`
  - `GET /api/v1/health/live`
  - `GET /api/v1/health/ready`
- `api-business`
  - `GET /api/v1/health/live`
  - `GET /api/v1/health/ready`
- `orchestrator`
  - `GET /health/live`
  - `GET /health/ready`

## Resource Baselines

Requests and limits in `k8s/base` are intended as safe starting points, not
final production tuning.

They are deliberately conservative and should be adjusted with real workload
data.

## Rendering

Render manifests locally:

```bash
npm run k8s:render:base
npm run k8s:render:dev
npm run k8s:render:staging
npm run k8s:render:prod
```

If `kubectl` is not installed locally, install it first or render through CI.
