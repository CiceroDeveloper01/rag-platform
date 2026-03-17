# Kubernetes Deployment Structure

This repository keeps Docker Compose as the default local development workflow.

The `k8s/` directory prepares the deployable applications for Kubernetes without
replacing the local Docker experience.

## Scope

These manifests cover the deployable application boundary only:

- `web`
- `api-web`
- `api-business`
- `orchestrator`

Infrastructure dependencies such as PostgreSQL, Redis, RabbitMQ, Grafana,
Prometheus, Loki, Tempo, and the OpenTelemetry Collector are expected to be
provided separately in Kubernetes.

## Layout

```text
k8s/
  base/
  overlays/
    dev/
    staging/
    prod/
```

## Usage

Render the base manifests:

```bash
kubectl kustomize k8s/base
```

Render an environment overlay:

```bash
kubectl kustomize k8s/overlays/dev
kubectl kustomize k8s/overlays/staging
kubectl kustomize k8s/overlays/prod
```

Apply an overlay:

```bash
kubectl apply -k k8s/overlays/dev
```

## Notes

- `secret.example.yaml` is intentionally not valid for real deployment. Replace
  every placeholder and create a real Secret before applying.
- `api-business` and `orchestrator` are internal services by design.
- RabbitMQ remains local via Docker Compose for development and external or
  separately managed in Kubernetes.
