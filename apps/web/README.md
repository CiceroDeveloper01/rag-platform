# Web

`apps/web` is the Next.js user interface for the platform.

## Responsibilities

The web app currently provides:

- dashboard and observability views
- omnichannel operator screens
- chat screens
- document upload and document status views

## Document Status Page

The repository now includes a persisted document status view:

- route: `/documents/status`

The UI polls API endpoints for:

- file name
- source channel when available
- status
- current step
- timestamps
- safe error information

The UI does not talk to RabbitMQ directly.

## Architectural Boundaries

- the web app is UI-only
- it should not hold domain logic that belongs in `api-business`
- it should prefer `api-web` for presentation/BFF use cases

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

Adjust this to the boundary you want to exercise locally.
