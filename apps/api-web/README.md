# API Web

`apps/api-web` is the presentation and BFF boundary for the web experience.

## Responsibilities

This app owns web-facing concerns such as:

- analytics
- agent traces
- health
- observability-oriented endpoints for the portal
- document upload and status proxy endpoints
- future portal-facing composition that should not live in `api-business`

## Architectural Boundaries

- it is not the business source of truth
- it is not the asynchronous worker runtime
- it should avoid re-implementing domain logic that belongs in `api-business`
- it remains the preferred web-facing API boundary for the `web` app

## Current Role in the Banking Scenario

The banking scenario is currently centered on `orchestrator` and `api-business`.

`api-web` still matters because it remains the natural place for web-specific aggregation, operator views, and future portal endpoints that should expose banking journeys without leaking internal business APIs directly to the frontend.

## Typical Local Commands

```bash
npm --prefix apps/api-web run lint
npm --prefix apps/api-web run test -- --runInBand
npm --prefix apps/api-web run build
npm --prefix apps/api-web run start:debug
```
