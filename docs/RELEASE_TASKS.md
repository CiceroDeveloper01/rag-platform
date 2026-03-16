# Release Tasks

This document tracks the final tasks required before the public release is
considered complete.

It is intentionally practical. Use it as the shared checklist for CI recovery,
manual validation, and publication follow-up.

## Current Status

- GitHub Actions is not yet confirmed green on the latest changes.
- The lockfile and Docker workspace fixes were prepared locally and still need
  to be fully validated in CI after push.
- Manual end-to-end validation is still incomplete.
- [x] The GitHub Wiki structure has already been published.

## 1. Source Control and Push

- [ ] Confirm the latest local commits are pushed to `origin/main`.
- [ ] Confirm the lockfile and Dockerfile fixes are included in the remote
      branch.
- [x] Confirm the wiki structure commit is present on `main`.

## 2. GitHub Actions

### Required outcome

- [ ] `npm ci` succeeds in CI.
- [ ] Docker image validation succeeds.
- [ ] API quality checks succeed.
- [ ] Web quality checks succeed.
- [ ] Documentation-related checks succeed.

### Current attention points

- [ ] Re-run CI after pushing the updated `package-lock.json`.
- [ ] Re-run CI after pushing the Dockerfile workspace manifest fix.
- [ ] Confirm no workflow still uses the wrong Docker build context.

## 3. Docker Validation

- [ ] Build the API image successfully.
- [ ] Build the orchestrator image successfully.
- [ ] Build the web image successfully.
- [ ] Confirm the images are using the workspace-aware Dockerfile changes.

### Local validation commands

```bash
npm run docker:build:api
npm run docker:build:orchestrator
npm run docker:build:web
```

## 4. Local Stack Validation

- [ ] Start the local infrastructure successfully.
- [ ] Confirm `api` is healthy.
- [ ] Confirm `web` loads correctly.
- [ ] Confirm `orchestrator` starts without restart loops in the intended local
      mode.
- [ ] If Telegram is enabled, confirm required credentials are present.
- [ ] If Telegram is not being tested, confirm it is disabled for local startup.

### Suggested checks

```bash
docker compose up -d --build
docker compose ps
docker compose logs rag-api --tail=100
docker compose logs rag-web --tail=100
docker compose logs rag-orchestrator --tail=100
```

## 5. Automated Test Validation

### API

- [ ] Unit and integration tests pass.
- [ ] E2E tests pass.
- [ ] Lint passes.

### Orchestrator

- [ ] Unit and integration tests pass.
- [ ] Coverage-critical flows remain healthy.
- [ ] Lint passes.

### Web

- [ ] Unit tests pass.
- [ ] Lint passes.
- [ ] Build succeeds.

### Suggested commands

```bash
npm run test:api
npm run test:e2e:api
npm run test:orchestrator
npm run test:web
npm run lint:api
npm --prefix apps/orchestrator run lint
npm run lint:web
```

## 6. Manual End-to-End Validation

### Core runtime flow

- [ ] Inbound message enters the runtime.
- [ ] Agent routing happens as expected.
- [ ] A downstream `flow-execution` job is produced.
- [ ] Outbound delivery behaves correctly.

### Document flow

- [ ] A document can be ingested successfully.
- [ ] Parsing completes without unexpected failures.
- [ ] Chunking and embedding generation complete successfully.
- [ ] The document becomes retrievable through the current RAG path.

### Retrieval flow

- [ ] A question against indexed content returns retrieved context.
- [ ] Retrieval fallback behavior remains safe when the primary path is not
      available.

### Feature toggles

- [ ] Critical toggles behave correctly when enabled.
- [ ] Critical toggles degrade safely when disabled.
- [ ] Skipped behavior is still visible in logs, metrics, or traces.

## 7. Documentation and Public Presentation

- [x] Root `README.md` reflects the current public story.
- [x] Canonical docs under `docs/` are in English.
- [x] The GitHub Wiki pages are published and navigable.
- [ ] `_Sidebar.md` works as expected in the GitHub Wiki.
- [ ] Main diagrams render correctly in GitHub.

## 8. Public Release Sign-off

Mark this section only when the release is truly ready.

- [ ] Latest `main` branch is pushed.
- [ ] GitHub Actions is green on the latest commit.
- [ ] Docker image validation is green.
- [ ] Manual end-to-end validation is complete.
- [ ] Wiki is published.
- [ ] No known release blocker remains open.

## Notes

- Terraform hooks are configured as manual checks because they depend on local
  tooling that may not be installed everywhere.
- Hadolint is configured not to fail on info-only findings.
- The repository still contains broader historical documentation; the canonical
  release-facing documents are the ones linked from `docs/README.md`.
- This checklist is intentionally written in English to match the public
  documentation standard used by the repository.
