import { Controller, Get, Headers } from '@nestjs/common';
import { TenantContextService } from '../../common/tenancy/tenant-context.service';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('agent-quality')
  getAgentQuality(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.analyticsService.getAgentQuality(
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('user-feedback')
  getUserFeedback(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.analyticsService.getUserFeedback(
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('ai-cost')
  getAiCost(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.analyticsService.getAiCost(this.resolveTenant(tenantIdHeader));
  }

  @Get('tenant-usage')
  getTenantUsage(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.analyticsService.getTenantUsage(
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('languages')
  getLanguages(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.analyticsService.getLanguages(
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('languages/timeline')
  getLanguageTimeline(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.analyticsService.getLanguageTimeline(
      this.resolveTenant(tenantIdHeader),
    );
  }

  private resolveTenant(tenantIdHeader?: string): string {
    return this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
    });
  }
}
