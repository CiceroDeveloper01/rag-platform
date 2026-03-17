# Deployment Guide

This document describes how to run **RAG-PLATAFORM** locally and prepare it for production environments.

The platform includes:

- NestJS backend API
- Next.js operational dashboard
- PostgreSQL database
- Redis cache
- RAG pipeline
- Omnichannel connectors
- Observability stack

The recommended local environment uses **Docker Compose**.

For cloud-oriented infrastructure provisioning, the repository also includes reusable **Terraform** modules under:

```text
infra/terraform
```

Related guide:

- [Terraform Infrastructure Guide](TERRAFORM.md)

---

# Local Development

The easiest way to run the platform locally is using Docker.

## Requirements

Install:

- Docker
- Docker Compose

Verify installation:

```bash
docker --version
docker compose version
```

---

# Starting the Environment

Run:

```bash
docker compose up -d --build
```

This will start the full platform stack.

Containers started include:

- NestJS API
- Next.js Web Dashboard
- PostgreSQL database
- Redis
- Prometheus
- Grafana
- Loki
- Promtail
- Jaeger
- OpenTelemetry Collector

---

# Service URLs

After startup the following services will be available.

| Service            | URL                           |
| ------------------ | ----------------------------- |
| Frontend Dashboard | http://localhost:3002         |
| Backend API        | http://localhost:3000         |
| Swagger UI         | http://localhost:3000/swagger |
| Redis              | localhost:6379                |
| Grafana            | http://localhost:3005         |
| Prometheus         | http://localhost:9090         |
| Tempo              | http://localhost:3200         |

---

# Database

The platform uses PostgreSQL.

External port:

```
localhost:5433
```

Example database name:

```
rag_platform
```

If using pgvector for RAG workloads, it will be initialized automatically during container startup.

---

# Cache Layer

The local stack includes Redis as the shared cache backend for the NestJS API.

External port:

```text
localhost:6379
```

Redis is used for:

- dashboard and analytics query caching
- retrieval caching in the RAG flow
- context assembly caching before LLM execution
- short-lived document metadata lookups

The final LLM answer is intentionally not cached by default.

---

# Database Initialization

PostgreSQL migrations are automatically executed when the container starts.

Migration scripts are mounted in:

```
docker-entrypoint-initdb.d
```

The first startup initializes the schema.

If you need a clean bootstrap:

```bash
docker compose down -v
docker compose up --build
```

This removes existing volumes and recreates the database.

---

# Stopping the Environment

To stop all containers:

```bash
docker compose down
```

To stop and remove volumes:

```bash
docker compose down -v
```

---

# Environment Variables

The platform relies on environment variables for configuration.

## Backend (API)

Required variables may include:

- OPENAI_API_KEY
- DB_HOST
- DB_PORT
- DB_USERNAME
- DB_PASSWORD
- DB_NAME
- REDIS_HOST
- REDIS_PORT
- REDIS_TTL_DEFAULT
- EMAIL_PROVIDER
- EMAIL_IMAP_HOST
- EMAIL_IMAP_PORT
- EMAIL_IMAP_SECURE
- EMAIL_SMTP_HOST
- EMAIL_SMTP_PORT
- EMAIL_SMTP_SECURE
- EMAIL_USERNAME
- EMAIL_PASSWORD
- EMAIL_POLL_INTERVAL_SECONDS
- EMAIL_INBOX
- EMAIL_FROM_ADDRESS
- EMAIL_MAX_ATTACHMENT_MB
- STORAGE_PROVIDER
- LOCAL_STORAGE_PATH
- MAX_DOCUMENT_SIZE_MB
- ALLOWED_DOCUMENT_TYPES
- FRONTEND_ORIGINS

Example:

```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ragdb
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_TTL_DEFAULT=30
EMAIL_PROVIDER=mock
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_SECURE=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=465
EMAIL_SMTP_SECURE=true
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_POLL_INTERVAL_SECONDS=30
EMAIL_INBOX=INBOX
EMAIL_FROM_ADDRESS=no-reply@rag-platform.local
EMAIL_MAX_ATTACHMENT_MB=10
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=storage/documents
MAX_DOCUMENT_SIZE_MB=10
ALLOWED_DOCUMENT_TYPES=pdf,txt,md,docx
```

---

## Frontend (Web)

Frontend variables typically include:

- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_GRAFANA_URL
- NEXT_PUBLIC_PROMETHEUS_URL

Example:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

# Observability Stack

The platform includes a full observability stack.

Components:

- Prometheus for metrics
- Grafana for dashboards
- Loki for log aggregation
- Promtail for container log collection
- Jaeger for distributed tracing
- OpenTelemetry Collector for telemetry routing
- Redis for centralized cache storage

These services allow monitoring of:

- API request volume
- latency
- RAG execution time

---

# Terraform Environments

The repository includes AWS-oriented Terraform compositions for:

- `infra/terraform/envs/dev`
- `infra/terraform/envs/staging`
- `infra/terraform/envs/prod`

Reusable modules are available in:

- `infra/terraform/modules/network`
- `infra/terraform/modules/compute`
- `infra/terraform/modules/postgres`
- `infra/terraform/modules/redis`
- `infra/terraform/modules/observability`

The current Terraform baseline provisions:

- VPC
- public and private subnets
- security groups
- EC2-based compute + Application Load Balancer
- RDS PostgreSQL
- ElastiCache Redis
- observability host

## Remote Terraform State

Each environment is configured to use a remote S3 backend and a DynamoDB lock table.

Expected bootstrap resources:

- S3 bucket: `rag-platform-terraform-state`
- DynamoDB table: `rag-platform-terraform-locks`

## Terraform Example

```bash
cd infra/terraform/envs/dev
terraform init
terraform plan
terraform apply
```

The `terraform.tfvars` files are intended as environment-specific examples and should be adjusted to your AWS account, networking rules, and secret handling model.

---

# Kubernetes Deployment

Basic Kubernetes manifests may be provided in a `k8s/` folder.

Typical resources include:

- api deployment
- web deployment
- postgres statefulset
- prometheus
- grafana
- ingress configuration

To deploy:

```bash
kubectl apply -f k8s/
```

---

# Seed Data

For local demos, the API includes a seed script:

```bash
cd apps/api-business
npm run seed
```

The seed creates representative records for:

- Telegram connector
- source document and chunk
- conversation and messages
- omnichannel request and execution

This makes the dashboard immediately usable in local environments.

---

# Storage Providers

The document ingestion pipeline supports pluggable storage providers:

- `local`
- `s3`
- `azure`
- `gcs`

Local development defaults to:

```text
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=storage/documents
```

See:

- [Storage Providers](../storage/STORAGE.md)

---

# Email Provider Layer

The omnichannel module can now receive and send email through a shared provider abstraction.

Supported provider implementations in the backend include:

- `gmail`
- `outlook`
- `yahoo`
- `imap`
- `mock`

For local development, `mock` is the safest default.

Gmail is the first real provider implementation and uses:

- IMAP for inbound polling
- SMTP for outbound delivery

The email provider health check is available at:

```text
GET /api/v1/health/email
```

---

# Omnichannel Idempotency

Inbound omnichannel channels use an idempotency table to prevent duplicate execution when the same external message is delivered more than once.

The strategy uses:

- `inbound_messages`
- unique constraint on `(channel, external_message_id)`

This is currently applied to:

- Telegram webhook inbound processing
- Email inbound processing

If a duplicate message arrives, the API returns success and skips the orchestrator instead of processing the same message twice.

---

# Production Deployment Recommendations

For production environments consider the following improvements.

## Database

Prefer a managed PostgreSQL service.

Examples:

- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL

Benefits:

- automated backups
- high availability
- better storage performance

---

## Secrets Management

Do not store secrets directly in configuration files.

Use one of the following:

- Kubernetes Secrets
- Hashicorp Vault
- AWS Secrets Manager

---

## HTTPS and Security

Use a reverse proxy or ingress controller.

Examples:

- NGINX Ingress
- Traefik
- AWS ALB Ingress

Requirements:

- TLS certificates
- secure cookies
- HTTPS-only traffic

---

## Scaling

Horizontal scaling should be introduced after measuring workload behavior.

Possible scaling targets:

- API containers
- RAG workers
- background ingestion jobs

---

# CI/CD

The repository includes a GitHub Actions pipeline located in:

```
.github/workflows/
```

The CI pipeline performs:

- dependency installation
- lint validation
- test execution
- application build
- Docker image build

This ensures that each commit produces a valid build.

---

# Release Checklist

Before deploying a new version verify:

1. Environment variables are configured
2. Database migrations are applied
3. `/health` endpoint responds correctly
4. `/metrics` endpoint is available
5. Grafana dashboards load successfully
6. Prometheus is scraping metrics
7. At least one RAG request can be executed
8. Omnichannel connectors are operational

---

# Future Deployment Improvements

Future platform versions may include:

- Helm charts
- Kubernetes autoscaling
- advanced ingress configuration
- production alerting rules
- multi-region deployment support
- automated database migrations

These improvements will enable fully automated cloud deployments.
