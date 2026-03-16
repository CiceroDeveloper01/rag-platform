# @rag-platform/utils

Pure shared utilities for the monorepo.

## What belongs here

- formatting helpers
- date helpers
- parsing helpers
- small pagination or string utilities

## What should not go here

- NestJS providers
- Next.js hooks
- HTTP clients
- database access
- business logic tied to a specific app

## Example

```ts
import { formatDate, truncateText } from "@rag-platform/utils";
```
