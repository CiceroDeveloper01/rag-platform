# Swagger / OpenAPI

Swagger UI is available at:

```text
http://localhost:3001/swagger
```

The backend documents the main operational modules with consistent OpenAPI annotations:

- `Omnichannel`
- `Chat`
- `RAG`
- `Documents`
- `Conversations`
- `Auth`
- `Health`

## Documentation Standard

Controllers should use:

- `@ApiTags`
- `@ApiOperation`
- `@ApiBody`
- `@ApiOkResponse`
- `@ApiBadRequestResponse`
- `@ApiUnauthorizedResponse`
- `@ApiNotFoundResponse`
- `@ApiParam`
- `@ApiQuery`

DTOs should use:

- `@ApiProperty`
- `@ApiPropertyOptional`

## What Is Documented

The current Swagger setup covers:

- omnichannel webhook and dashboard endpoints
- RAG chat and search endpoints
- document ingestion and source management
- authentication and conversation endpoints
- health endpoints under `/health` and `/api/v1/health`

The Prometheus `/metrics` endpoint is intentionally excluded from Swagger UI because it returns machine-oriented text exposition rather than JSON API payloads.

## How to Document New Endpoints

1. Add a clear `@ApiTags` group to the controller.
2. Describe the endpoint purpose with `@ApiOperation`.
3. Annotate request DTOs with `@ApiProperty` examples.
4. Add success and main error responses.
5. Prefer concrete DTO types over anonymous schemas whenever possible.

## DTO Guidance

When documenting DTOs:

- provide realistic examples
- describe optional filters clearly
- keep field names aligned with the API contract
- avoid framework-specific or persistence-specific leakage in public response models
