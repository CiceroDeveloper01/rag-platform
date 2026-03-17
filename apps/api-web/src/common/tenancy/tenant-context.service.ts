import { Injectable } from '@nestjs/common';

export interface ResolveTenantOptions {
  headerTenantId?: string;
  explicitTenantId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TenantContextService {
  resolveTenant(options: ResolveTenantOptions): string {
    const metadataTenantId =
      typeof options.metadata?.tenantId === 'string'
        ? options.metadata.tenantId
        : undefined;

    return (
      options.explicitTenantId?.trim() ||
      options.headerTenantId?.trim() ||
      metadataTenantId?.trim() ||
      'default-tenant'
    );
  }
}
