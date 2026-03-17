# Contributing to RAG Platform

First of all, thank you for considering contributing to **RAG Platform**.

This project is a production-oriented TypeScript monorepo for AI agent orchestration, RAG, asynchronous document ingestion, and observability.

We welcome contributions from developers, engineers, researchers, and AI enthusiasts.

---

# Table of Contents

- Code of Conduct
- Ways to Contribute
- Development Setup
- Project Structure
- Branch Strategy
- Commit Convention
- Pull Request Guidelines
- Code Quality
- Reporting Bugs
- Suggesting Features

---

# Code of Conduct

This project follows the rules defined in:

`CODE_OF_CONDUCT.md`

Please make sure your participation respects the guidelines defined there.

We want this project to be a respectful and welcoming place for everyone.

---

# Ways to Contribute

You can contribute in many ways:

### Code Contributions

- bug fixes
- performance improvements
- new connectors
- observability improvements
- documentation improvements

### AI Features

- RAG improvements
- agent orchestration strategies
- vector search optimizations

### Infrastructure

- Docker improvements
- CI/CD improvements
- observability dashboards

### Documentation

- README improvements
- architecture explanations
- usage examples

---

# Development Setup

Clone the repository:

```bash
git clone https://github.com/cicero.developer01/RAG-PLATAFORM.git
cd RAG-PLATAFORM
npm ci
```

Use Docker for infrastructure and run the apps locally for normal development:

```bash
npm run dev:infra
```

If you need the full containerized stack instead:

```bash
docker compose --env-file ./infra/docker/.env.docker up -d --build
```

Current app boundaries:

- `apps/web`
  - UI only
- `apps/api-web`
  - portal-facing BFF and presentation concerns
- `apps/api-business`
  - synchronous business/domain APIs
- `apps/orchestrator`
  - asynchronous runtime, workers, channels, and agents

RabbitMQ is used only for asynchronous document ingestion. Chat remains synchronous.

Deployment assets are split intentionally:

- `docker-compose.yml`
  - local infrastructure and optional full local stack
- `k8s/`
  - Kubernetes manifests for deployable app services

Do not replace the Docker local workflow with Kubernetes-only instructions in
documentation or scripts.

## Testing

Recommended validation flow:

```bash
npm run build:packages
npm run test:packages
npm run test:api
npm run test:e2e:api
npm run test:web
npm --prefix apps/orchestrator run test
```

Coverage:

```bash
npm run coverage:api
npm run coverage:web
```

Full CI-style validation:

```bash
npm run ci
```

## Architecture and Documentation

Before making structural changes, review the canonical documentation:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/RUNNING_LOCALLY.md`
- `docs/TESTING_GUIDE.md`
- `docs/deployment/DEPLOYMENT.md`
- `docs/deployment/KUBERNETES.md`

When changing boundaries between apps, queue topology, or asynchronous document ingestion behavior, update the relevant docs and ADRs in the same change.

## Performance Tests

Initial load testing assets live in:

`tests/performance/`

Examples:

```bash
npm run perf:smoke
npm run perf:load:analytics
CHAT_SESSION_COOKIE="rag_platform_session=..." npm run perf:load:chat
npm run perf:stress:documents
```

These scripts require `k6` to be installed locally. See [tests/performance/README.md](/home/cicero/projects/rag-platform/tests/performance/README.md) for details.
