# API Web

`apps/api-web` is the presentation and BFF boundary for the portal.

## Responsibilities

This app owns portal-facing concerns such as:

- analytics
- agent traces
- health
- omnichannel monitoring
- simulation
- document upload and status proxy endpoints for the web portal

## Documents Role

For the current async document flow, `api-web` acts as a proxy boundary for the portal:

- forwards uploads to `api-business`
- forwards document status queries
- keeps web-facing concerns out of the business API when a BFF boundary is useful

## Architectural Boundaries

- it is not the source of truth for business persistence
- it is not the asynchronous worker runtime
- it should avoid re-implementing domain logic already owned by `api-business`

## Typical Local Commands

```bash
npm --prefix apps/api-web run lint
npm --prefix apps/api-web run test -- --runInBand
npm --prefix apps/api-web run build
npm --prefix apps/api-web run start:debug
```
