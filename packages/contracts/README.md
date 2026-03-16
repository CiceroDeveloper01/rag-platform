# @rag-platform/contracts

Shared request and response contracts used across the backend and frontend.

## What belongs here

- API payload contracts
- shared integration request/response shapes
- dashboard response models

## What should not go here

- NestJS DTO classes with decorators
- database entities
- repository interfaces
- framework-specific code

## Example

```ts
import type {
  ChatRequest,
  OmnichannelOverviewResponse,
} from "@rag-platform/contracts";
```
