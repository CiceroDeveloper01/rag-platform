# Release Tasks

This document is the release validation checklist for the repository.

It should be used by engineers performing the final review before a public
release, demo handoff, or controlled production rollout.

The goal is not to describe future ideas. The goal is to verify what the
repository actually contains today and confirm that the current system is
buildable, testable, and understandable.

## How To Use This Checklist

- Treat this file as the shared release checklist for the team.
- Mark items as complete only after the verification was actually performed.
- Keep release notes factual and tied to the current repository state.
- Use the canonical documentation in `docs/` as the source of truth for release
  review.

## Current Repository Baseline

The repository already includes:

- a domain-oriented monorepo structure
- strict application boundaries across `apps/web`, `apps/api-business`, and
  `apps/orchestrator`
- channel-specific organization under the orchestrator
- canonical architecture documentation in English
- architecture decision validation in English
- Mermaid diagrams in the main documentation set
- Dockerfiles and a local Docker Compose stack
- automated tests for API, orchestrator, web, and critical flows

Known operational note:

- the local Docker stack can still place `orchestrator` into a restart loop when
  Telegram is enabled without `TELEGRAM_BOT_TOKEN`

## 1. Repository Structure Validation

### Monorepo boundaries

- [ ] Confirm `apps/web` contains only frontend concerns.
- [ ] Confirm `apps/api-business` contains only API and synchronous backend concerns.
- [ ] Confirm `apps/orchestrator` contains the async runtime and channel-facing
      orchestration concerns.
- [ ] Confirm `packages/*` only contains code that is truly reusable across
      applications.

### Structural clarity

- [ ] Confirm there are no obviously duplicated runtime trees or legacy module
      structures still active in the codebase.
- [ ] Confirm domain-heavy modules are grouped by responsibility rather than
      stored in large flat folders.
- [ ] Confirm tests remain close to the code they validate when practical.
- [ ] Confirm directory names and file names match their contents.
- [ ] Confirm there are no accidental empty directories or stale compatibility
      folders that still suggest an outdated architecture.

### Suggested review commands

```bash
find apps -maxdepth 3 -type d | sort
find packages -maxdepth 3 -type d | sort
git status --short --branch
```

## 2. Build Validation

- [ ] Build all shared packages successfully.
- [ ] Build the API successfully.
- [ ] Build the orchestrator successfully.
- [ ] Build the web application successfully.
- [ ] Confirm no build step depends on stale generated output already checked
      into the repository.

### Suggested commands

```bash
npm run build:packages
npm run build:api
npm run build:orchestrator
npm run build:web
```

## 3. Test Execution

### Required automated validation

- [ ] Run the full CI-equivalent command successfully.
- [ ] Confirm API unit and integration tests pass.
- [ ] Confirm API end-to-end tests pass.
- [ ] Confirm orchestrator tests pass.
- [ ] Confirm web tests pass.
- [ ] Confirm coverage commands still succeed.

### Code quality checks

- [ ] Confirm API lint passes.
- [ ] Confirm orchestrator lint passes.
- [ ] Confirm web lint passes.
- [ ] Confirm pre-commit hooks do not block a normal release commit.

### Suggested commands

```bash
npm run ci
npm run lint:api
npm --prefix apps/orchestrator run lint
npm run lint:web
pre-commit run --all-files
```

## 4. Docker Local Runtime Verification

### Image build validation

- [ ] Build the API image successfully.
- [ ] Build the orchestrator image successfully.
- [ ] Build the web image successfully.
- [ ] Confirm the Dockerfiles still work with the monorepo root build context.

### Compose stack validation

- [ ] Start the local stack successfully.
- [ ] Confirm `api` becomes healthy.
- [ ] Confirm `web` starts successfully.
- [ ] Confirm infrastructure services (`postgres`, `redis`, `grafana`, `loki`,
      `tempo`, `otel`, `prometheus`, `promtail`) start successfully.
- [ ] Confirm whether `orchestrator` is healthy or intentionally blocked by
      local Telegram configuration.
- [ ] If `orchestrator` restarts, capture the exact reason in the release notes.

### Suggested commands

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 orchestrator
docker compose logs --tail=100 web
```

## 5. Channels Validation

### Telegram

- [ ] If Telegram is enabled locally, confirm `TELEGRAM_BOT_TOKEN` and
      `TELEGRAM_BOT_USERNAME` are configured.
- [ ] Send a real or controlled Telegram message through the system.
- [ ] Confirm the message reaches the inbound queue.
- [ ] Confirm the orchestrator processes the event.
- [ ] Confirm outbound delivery succeeds.

### Email

- [ ] Confirm the Email listener mode used in the current environment is clear.
- [ ] Confirm Email inbound normalization still works for the current runtime
      path.
- [ ] Confirm Email outbound behavior remains isolated from routing logic.

### WhatsApp

- [ ] Confirm the WhatsApp listener mode used in the current environment is
      clear.
- [ ] Confirm WhatsApp inbound normalization still works for the current
      runtime path.
- [ ] Confirm WhatsApp outbound behavior remains isolated from routing logic.

### Cross-channel checks

- [ ] Confirm channel adapters remain transport-focused and do not embed
      business logic.
- [ ] Confirm channel-specific code is grouped under channel domains.
- [ ] Confirm channel payload normalization still produces canonical runtime
      input.

## 6. Queue and Runtime Validation

- [ ] Confirm the `inbound-messages` queue is functional.
- [ ] Confirm the `flow-execution` queue is functional.
- [ ] Confirm retry behavior is still active.
- [ ] Confirm DLQ behavior still works for terminal failures.
- [ ] Confirm the orchestrator still follows the expected runtime path:
      channel -> inbound queue -> processor -> agent graph -> flow execution ->
      outbound.

### Suggested checks

- inspect queue worker logs
- trigger one valid inbound message
- trigger one intentionally failing flow and confirm DLQ behavior

## 7. Document Ingestion Pipeline

- [ ] Send or register a document through a supported path.
- [ ] Confirm file reception succeeds.
- [ ] Confirm parsing succeeds.
- [ ] Confirm chunking succeeds.
- [ ] Confirm embedding generation succeeds.
- [ ] Confirm indexing completes successfully.
- [ ] Confirm document metadata remains consistent through the pipeline.

### Validation scenarios

- [ ] single document ingest
- [ ] document ingest with attachment metadata
- [ ] ingest failure path produces clear diagnostics

## 8. RAG Retrieval Verification

- [ ] Query against previously indexed content.
- [ ] Confirm relevant documents are retrieved.
- [ ] Confirm retrieval context is assembled into the execution flow.
- [ ] Confirm fallback behavior remains safe if the primary retrieval path is
      unavailable.
- [ ] Confirm retrieval remains tenant-aware.

### Validation scenarios

- [ ] one positive retrieval scenario
- [ ] one no-result scenario
- [ ] one fallback scenario if supported in the local environment

## 9. Conversation Memory Verification

- [ ] Confirm message memory is stored for a conversation.
- [ ] Confirm context retrieval uses the expected conversation boundary.
- [ ] Confirm memory behavior still respects tenant metadata.
- [ ] Confirm conversation memory can be disabled safely through feature
      toggles.

## 10. Feature Toggle Validation

- [ ] Confirm the main toggles used by the repository are documented and still
      wired correctly.
- [ ] Confirm safe degradation behavior when toggles are disabled.
- [ ] Confirm logs, traces, or metrics make skipped behavior visible.

### Suggested toggle coverage

- [ ] `TELEGRAM_ENABLED`
- [ ] `DOCUMENT_INGESTION_ENABLED`
- [ ] `DOCUMENT_PARSING_ENABLED`
- [ ] `RAG_RETRIEVAL_ENABLED`
- [ ] `CONVERSATION_MEMORY_ENABLED`
- [ ] `EVALUATION_ENABLED`
- [ ] `OUTBOUND_SENDING_ENABLED`

## 11. Observability Validation

- [ ] Confirm structured logging is active in API and orchestrator.
- [ ] Confirm metrics are exposed or recorded as expected.
- [ ] Confirm distributed tracing is still wired.
- [ ] Confirm agent traces are emitted for runtime flows.
- [ ] Confirm queue-related failures are diagnosable from logs and traces.
- [ ] Confirm cost and evaluation telemetry still appears when those flows are
      active.

### Suggested checks

- [ ] inspect application logs during one inbound flow
- [ ] inspect agent trace events during routing and execution
- [ ] inspect metrics endpoints or dashboards in the local stack

## 12. Multi-Tenancy and Isolation Validation

- [ ] Confirm tenant metadata is propagated through inbound processing.
- [ ] Confirm document ingest remains tenant-aware.
- [ ] Confirm retrieval remains tenant-aware.
- [ ] Confirm memory access remains tenant-aware.
- [ ] Confirm no test or local shortcut bypasses tenant context unexpectedly.

## 13. Architecture Documentation Review

- [ ] Confirm `docs/ARCHITECTURE.md` still matches the real repository.
- [ ] Confirm `docs/ARCHITECTURE_DECISIONS.md` still matches the current code.
- [ ] Confirm `docs/RUNNING_LOCALLY.md` remains accurate.
- [ ] Confirm `docs/TESTING_GUIDE.md` remains accurate.
- [ ] Confirm `docs/CHANNEL_INTEGRATION.md` remains accurate.
- [ ] Confirm `docs/DATABASE.md` remains accurate.
- [ ] Confirm Mermaid diagrams render correctly in GitHub.

## 14. Developer Onboarding Validation

- [ ] Confirm a new engineer can identify the main architecture entry points
      from `README.md` and `docs/README.md`.
- [ ] Confirm local setup instructions are sufficient to start the stack.
- [ ] Confirm test commands are discoverable and up to date.
- [ ] Confirm release-facing documentation is written in English.
- [ ] Confirm code comments remain in English where comments exist.

## 15. Final Manual Release Review

Use this section as the human sign-off before the final release decision.

### Final repository review

- [ ] The working tree is clean.
- [ ] The intended branch is up to date and pushed.
- [ ] The release commit history is understandable.
- [ ] No temporary debug files or local-only artifacts remain tracked.

### Final product review

- [ ] Core runtime flow works in a validated environment.
- [ ] One inbound message was processed successfully.
- [ ] One document ingestion flow was validated.
- [ ] One retrieval flow was validated.
- [ ] One memory flow was validated.
- [ ] Feature toggle behavior was spot-checked.
- [ ] Observability was spot-checked.

### Final documentation review

- [ ] README is suitable for first-time readers.
- [ ] Canonical documentation links work.
- [ ] Wiki pages are published and navigable.
- [ ] Architecture and release notes do not describe non-existent behavior.

## Final Sign-off

Mark this section only when the release is genuinely ready.

- [ ] Repository structure review completed
- [ ] Build validation completed
- [ ] Automated tests completed
- [ ] Docker local runtime verified
- [ ] Channel validation completed
- [ ] Document ingestion validated
- [ ] RAG retrieval validated
- [ ] Conversation memory validated
- [ ] Feature toggles validated
- [ ] Observability validated
- [ ] Architecture documentation validated
- [ ] Developer onboarding review completed
- [ ] Final manual review completed
- [ ] No known release blocker remains open

## Notes

- Local Docker validation may still require explicit Telegram configuration if
  the listener is enabled.
- Frontend builds may emit chart sizing warnings during static generation
  without failing the build.
- Terraform-related checks are still treated as environment-dependent manual
  checks rather than universal pre-commit blockers.
