import { Injectable } from "@nestjs/common";
import { TenantConfig, TenantConfigLoader } from "./tenant-config.loader";
import {
  TenantResolutionContext,
  TenantResolverService,
} from "./tenant-resolver.service";

export interface TenantContext {
  tenantId: string;
  config: TenantConfig;
}

@Injectable()
export class TenantContextMiddleware {
  constructor(
    private readonly tenantResolverService: TenantResolverService,
    private readonly tenantConfigLoader: TenantConfigLoader,
  ) {}

  attach(context: TenantResolutionContext): TenantContext {
    const tenantId = this.tenantResolverService.resolveTenant(context);
    const config = this.tenantConfigLoader.load(tenantId);

    return {
      tenantId,
      config,
    };
  }
}
