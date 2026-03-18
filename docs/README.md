# Project Documentation

This directory contains the canonical technical documentation for the current monorepo.

## Recommended Reading Order

1. [Architecture](ARCHITECTURE.md)
2. [Architecture Decisions](ARCHITECTURE_DECISIONS.md)
3. [Running Locally](RUNNING_LOCALLY.md)
4. [Security Architecture](architecture/security-architecture.md)
5. [Testing Guide](TESTING_GUIDE.md)
6. [Deployment Model](deployment/DEPLOYMENT.md)
7. [Kubernetes Readiness](deployment/KUBERNETES.md)
8. [Channel Integration](CHANNEL_INTEGRATION.md)
9. [Database](DATABASE.md)
10. [Technical Debt](TECHNICAL_DEBT.md)

## Current Documentation Map

```mermaid
flowchart TD
    Docs[docs/] --> Architecture[ARCHITECTURE.md]
    Docs --> Decisions[ARCHITECTURE_DECISIONS.md]
    Docs --> Local[RUNNING_LOCALLY.md]
    Docs --> Security[architecture/security-architecture.md]
    Docs --> Deployment[deployment/DEPLOYMENT.md]
    Docs --> Kubernetes[deployment/KUBERNETES.md]
    Docs --> Testing[TESTING_GUIDE.md]
    Docs --> Channels[CHANNEL_INTEGRATION.md]
    Docs --> Database[DATABASE.md]
    Docs --> Debt[TECHNICAL_DEBT.md]
```

## Canonical Documents

- [Architecture](ARCHITECTURE.md)
- [Architecture Decisions](ARCHITECTURE_DECISIONS.md)
- [Running Locally](RUNNING_LOCALLY.md)
- [Security Architecture](architecture/security-architecture.md)
- [How Security Works](security/how-security-works.md)
- [Deployment Model](deployment/DEPLOYMENT.md)
- [Kubernetes Readiness](deployment/KUBERNETES.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Channel Integration](CHANNEL_INTEGRATION.md)
- [Database](DATABASE.md)
- [Technical Debt](TECHNICAL_DEBT.md)
- [Release Tasks](RELEASE_TASKS.md)

## Historical and Supporting Material

- [Historical ADRs](adr/)
- [Runtime Flow](runtime-flow.md)
- [RAG Flow](rag/rag-flow.md)
- [Telegram Channel](channels/telegram.md)
- [Legacy Architecture Reference](architecture/ARCHITECTURE.md)
- [Compatibility Entry](architecture.md)
