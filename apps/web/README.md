# Web

`apps/web` is the Next.js interface for the Intelligent Automation Platform.

## Current Product Positioning

The web app now presents the platform as a digital banking workspace with:

- financial dashboard and banking modules
- contextual intelligent assistant embedded into the product
- omnichannel conversations and handoff visibility
- a controlled conversation simulator for validation and portfolio demos
- observability and monitoring views for operators
- document and runtime surfaces that remain available as supporting capabilities

The UI is no longer positioned as a generic RAG or chat demo. Chat remains a capability, but not the center of the experience.

## Responsibilities

The web app is responsible for:

- customer and operator-facing banking journeys
- modular navigation across dashboard, cards, credit, investments, customer, conversations, simulator, handoffs, assistant and monitoring
- rendering data from backend boundaries
- exposing contextual assistant entry points without owning orchestration logic

## Architectural Boundaries

- `apps/web` is presentation only
- domain logic belongs in `api-business`
- decision orchestration belongs in `orchestrator`
- presentation aggregation should prefer `api-web` when the boundary exists
- temporary frontend fallbacks may be used only to keep the UX coherent while some banking routes are not yet exposed through the current web boundary

## Current Integration Shape

The current experience uses:

- banking endpoints when available through the configured API base URL
- coherent frontend fallbacks for banking modules when the active boundary still does not proxy every route
- omnichannel request data when available, with operational mocks for conversation and handoff views when necessary
- observability and omnichannel APIs for monitoring views
- chat APIs as the transport behind the contextual assistant

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
