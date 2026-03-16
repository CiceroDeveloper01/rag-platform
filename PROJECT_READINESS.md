# Project Readiness Checklist

This document provides a final readiness review checklist for the RAG-PLATAFORM repository.
Its purpose is to verify that the system is coherent, production-oriented, and ready for demonstration, evaluation, or deployment.

This checklist should be used after major architectural or feature changes and before publishing the repository publicly.

---

# 1. Repository Structure

Confirm that the repository structure is consistent and avoids duplication.

Expected structure:

RAG-PLATAFORM
├ apps
│ ├ api
│ └ web
│
├ docs
│
├ infra
│ └ terraform
│
├ .github
│ └ workflows
│
├ docker
│
├ .env.example
├ README.md
└ PROJECT_READINESS.md

Check for accidental duplicates such as:

- doc vs docs
- workflow vs workflows
- duplicated storage or service directories

---

# 2. Backend Architecture

Verify that the backend contains the main architectural modules:

- Omnichannel / MCP orchestration
- RAG pipeline
- Agent execution layer
- Execution tracking
- Dashboard query layer
- Health checks
- Observability utilities
- Cache service
- Storage abstraction
- Feature flags
- AI usage policy

Ensure that:

- services are separated from controllers
- DTOs are defined
- dependency injection is used consistently

---

# 3. Frontend Structure

Verify that the frontend dashboard includes:

- main dashboard page
- requests view
- request details view
- connectors view
- live activity stream
- reusable UI components
- hooks or services for API communication

Check that components are organized and not duplicated across folders.

---

# 4. Local Infrastructure (Docker)

Confirm that the local stack starts successfully.

Services expected:

- API
- Web frontend
- PostgreSQL
- Redis
- Prometheus
- Grafana
- Loki
- Jaeger
- OpenTelemetry Collector

Key checks:

- PostgreSQL configured on port 5433
- Redis accessible from API
- volumes configured
- container health checks present

---

# 5. Environment Configuration

Ensure `.env.example` contains all required variables.

Typical configuration groups:

- Database
- Redis
- OpenAI
- Storage provider
- Telegram connector
- Email connector
- Observability
- Feature flags
- AI usage policy
- Upload limits

No variable used in code should be missing from `.env.example`.

---

# 6. Storage Abstraction

Confirm that file storage uses a provider abstraction.

Expected providers:

- Local storage provider
- Amazon S3 provider
- Azure Blob provider
- Google Cloud Storage provider

Verify:

- a single storage interface exists
- provider is selected using environment variables
- providers are injected via dependency injection

---

# 7. Email Connector

Check the email connector abstraction.

Expected architecture:

EmailProvider interface
├ Gmail provider
├ Outlook provider (future)
├ IMAP provider (future)

Ensure:

- Gmail works as initial provider
- abstraction allows additional providers later
- configuration is environment-driven

---

# 8. API Documentation (Swagger)

Open Swagger and verify:

- tags grouped by module
- DTO examples present
- error responses documented
- omnichannel endpoints visible
- dashboard endpoints visible
- ingestion endpoints documented

Swagger should provide a usable API overview.

---

# 9. Cache Usage

Verify Redis cache is applied appropriately.

Good candidates for caching:

- dashboard queries
- retrieval results
- metadata queries

Avoid caching:

- full LLM responses
- orchestration flows
- connector dispatch logic

Ensure TTL values are centralized.

---

# 10. Observability

Confirm observability features exist:

- tracing interceptors
- metrics interceptors
- structured logging
- execution event tracking
- metrics for RAG and connectors

Check that tracing is centralized and not manually implemented everywhere.

---

# 11. Live Activity Stream

Validate real-time activity stream behavior.

Checks:

- SSE endpoint responds correctly
- frontend subscribes to stream
- events appear in dashboard
- colored events and icons display
- buffer limits applied
- reconnect logic works

This feature significantly improves demonstration quality.

---

# 12. AI Usage Policy

Ensure AI policy enforcement exists.

Checks:

- maximum prompt size
- maximum completion tokens
- request rate limits
- policy applied before agent execution
- policy metrics exposed

This prevents uncontrolled LLM costs.

---

# 13. Feature Flags

Feature flags must allow runtime control via environment variables.

Typical flags:

FEATURE_RAG_ENABLED
FEATURE_TELEGRAM_ENABLED
FEATURE_EMAIL_ENABLED
FEATURE_LIVE_ACTIVITY_ENABLED
FEATURE_AI_USAGE_POLICY_ENABLED
FEATURE_RETRIEVAL_CACHE_ENABLED
FEATURE_DASHBOARD_ENABLED

Verify that disabled features fail gracefully.

---

# 14. Health Check Endpoints

Verify existence of health endpoints such as:

/api/v1/health
/api/v1/health/db
/api/v1/health/redis
/api/v1/health/storage
/api/v1/health/email
/api/v1/health/rag

Health responses should include meaningful status data.

---

# 15. Standard Error Response

All API errors should follow a consistent structure.

Example response structure:

code
message
details
traceId
timestamp

Verify that controllers do not return inconsistent formats.

---

# 16. Document Ingestion Validation

If the system ingests documents for RAG, ensure:

- maximum upload size enforced
- accepted file types validated
- metadata sanitized
- invalid uploads produce safe errors

---

# 17. Seed or Demo Data

Verify presence of demo data utilities.

Useful items include:

- seed script
- sample connectors
- demo documents
- demo requests
- demo execution events

Demo data improves testing and demonstrations.

---

# 18. Testing Coverage

Review tests by category.

Unit tests should cover:

- service level logic
- policy logic
- cache behavior
- feature flag behavior

Integration tests should cover:

- API endpoints
- ingestion validation
- health checks
- dashboard queries

E2E tests should cover:

- application boot
- core flows
- feature flag effects

Ensure tests do not require external cloud services.

---

# 19. Documentation Consistency

Verify that the docs directory matches the codebase.

Important documents may include:

- architecture overview
- database documentation
- deployment guide
- observability guide
- API reference
- feature flags
- AI usage policy
- live activity stream

Ensure internal links work.

---

# 20. Terraform and CI/CD

Confirm infrastructure configuration exists.

Expected areas:

infra/terraform/modules
infra/terraform/envs/dev
infra/terraform/envs/staging
infra/terraform/envs/prod

CI workflows should include:

- lint
- tests
- build
- optional deploy stages

Infrastructure does not need to deploy automatically yet but should demonstrate intent.

---

# Final Readiness Criteria

The project can be considered ready for presentation or portfolio when:

- the system runs locally
- API documentation is accessible
- dashboard operates correctly
- live activity stream functions
- health checks provide system visibility
- documentation reflects real implementation
- tests provide basic safety coverage
- infrastructure and CI pipelines exist

---

# Usage

Before releasing a new version:

1. Run this checklist.
2. Fix gaps discovered.
3. Update documentation where necessary.
4. Commit readiness updates.

This ensures the project remains coherent, reliable, and maintainable.
