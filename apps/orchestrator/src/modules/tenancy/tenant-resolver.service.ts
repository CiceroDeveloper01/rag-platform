import { Injectable } from "@nestjs/common";

export interface TenantResolutionContext {
  headers?: Record<string, string | undefined>;
  metadata?: Record<string, unknown>;
  jwt?: { tenantId?: string; sub?: string };
}

@Injectable()
export class TenantResolverService {
  resolveTenant(context: TenantResolutionContext): string {
    const headerTenantId =
      context.headers?.["x-tenant-id"] ?? context.headers?.["tenant-id"];
    const metadataTenantId =
      typeof context.metadata?.tenantId === "string"
        ? context.metadata.tenantId
        : undefined;
    const jwtTenantId =
      context.jwt?.tenantId ??
      (context.jwt?.sub ? `tenant:${context.jwt.sub}` : undefined);

    return (
      headerTenantId?.trim() ||
      metadataTenantId?.trim() ||
      jwtTenantId?.trim() ||
      "default-tenant"
    );
  }
}
