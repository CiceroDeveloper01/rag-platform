import { Module } from "@nestjs/common";
import { TenantConfigLoader } from "./tenant-config.loader";
import { TenantContextMiddleware } from "./tenant-context.middleware";
import { TenantResolverService } from "./tenant-resolver.service";

@Module({
  providers: [
    TenantResolverService,
    TenantConfigLoader,
    TenantContextMiddleware,
  ],
  exports: [TenantResolverService, TenantConfigLoader, TenantContextMiddleware],
})
export class TenancyModule {}
