# Contributing to RAG-PLATAFORM

First of all, thank you for considering contributing to **RAG-PLATAFORM**.

This project aims to build a production-ready **Omnichannel AI Gateway with RAG capabilities**, combining modern backend architecture, observability, and AI orchestration.

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
npm --prefix apps/api-business ci
npm --prefix apps/web ci
```

Start the local infrastructure when backend integration and e2e flows require dependencies such as PostgreSQL, Redis, or the observability stack:

```bash
docker compose --env-file ./infra/docker/.env.docker up -d --build
```

PostgreSQL remains externally available on port `5433`.

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
