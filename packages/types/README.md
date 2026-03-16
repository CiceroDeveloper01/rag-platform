# @rag-platform/types

Shared enums, aliases, and primitive type contracts for the monorepo.

## What belongs here

- channel and status enums
- pagination and filter primitives
- small cross-app aliases that do not depend on frameworks

## What should not go here

- NestJS DTO classes
- Next.js component props
- database entities
- HTTP clients or business logic

## Example

```ts
import { ChannelType, PaginationMeta } from "@rag-platform/types";
```
