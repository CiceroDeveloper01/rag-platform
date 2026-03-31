# Web

`apps/web` is the Next.js user and operator interface for the platform.

## Responsibilities

The web app currently provides:

- chat and interaction surfaces
- operational and observability screens
- document upload and document status views
- future banking-facing user experience layers

## Architectural Boundaries

- the web app is UI-only
- it should not own orchestration logic
- it should not contain business logic that belongs in `api-business`
- it should prefer `api-web` for presentation and BFF use cases

## Current Role in the Banking Scenario

The banking account manager is orchestrated in `apps/orchestrator` and backed by `api-business`, while `web` remains the natural place for customer and operator-facing interaction surfaces.

## Typical Local Commands

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run build
npm --prefix apps/web run dev
```

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```
