import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequiredScopes } from '../../../../common/decorators/required-scopes.decorator';
import { SessionAuthGuard } from '../../../auth/guards/session-auth.guard';
import { ScopesGuard } from '../../../auth/guards/scopes.guard';
import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { ToggleConnectorRequest } from '../../application/dtos/request/toggle-connector.request';
import { OmnichannelConnectorService } from '../../application/services/omnichannel-connector.service';
import { OmnichannelQueryService } from '../../application/services/omnichannel-query.service';
import {
  ChannelMetricsDto,
  ConnectorDto,
  LatencyMetricsDto,
  OmnichannelExecutionDetailsDto,
  OmnichannelOverviewResponseDto,
  OmnichannelRequestDetailsDto,
  PaginatedOmnichannelExecutionListDto,
  PaginatedOmnichannelRequestListDto,
  RagUsageMetricsDto,
} from '../../application/dtos/response/omnichannel-dashboard.response';
import { GetChannelMetricsQuery } from '../../application/queries/get-channel-metrics.query';
import { GetLatencyMetricsQuery } from '../../application/queries/get-latency-metrics.query';
import { GetOverviewQuery } from '../../application/queries/get-overview.query';
import { GetRagUsageQuery } from '../../application/queries/get-rag-usage.query';
import { ListConnectorsQuery } from '../../application/queries/list-connectors.query';
import { ListExecutionsQuery } from '../../application/queries/list-executions.query';
import { ListRequestsQuery } from '../../application/queries/list-requests.query';

@ApiTags('Omnichannel', 'Dashboard')
@ApiCookieAuth('rag_platform_session')
@Controller('api/v1/omnichannel')
@UseGuards(SessionAuthGuard, ScopesGuard)
export class OmnichannelDashboardController {
  constructor(
    private readonly queryService: OmnichannelQueryService,
    private readonly connectorService: OmnichannelConnectorService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('overview')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary:
      'Returns aggregated omnichannel metrics for the operational dashboard.',
  })
  @ApiOkResponse({ type: OmnichannelOverviewResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid dashboard overview filters.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  overview(
    @Query() query: GetOverviewQuery,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.getOverview(
      query,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('requests')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary: 'Returns paginated omnichannel requests with optional filtering.',
  })
  @ApiOkResponse({ type: PaginatedOmnichannelRequestListDto })
  @ApiBadRequestResponse({
    description: 'Invalid request filters or pagination values.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  listRequests(
    @Query() query: ListRequestsQuery,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.listRequests(
      query,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('requests/:id')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary:
      'Returns details for a single omnichannel request and its latest execution.',
  })
  @ApiParam({ name: 'id', type: Number, example: 101 })
  @ApiOkResponse({ type: OmnichannelRequestDetailsDto })
  @ApiNotFoundResponse({ description: 'Omnichannel request not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getRequest(
    @Param('id', ParseIntPipe) messageId: number,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.getRequestById(
      messageId,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('executions')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary:
      'Returns paginated omnichannel executions with optional filtering.',
  })
  @ApiOkResponse({ type: PaginatedOmnichannelExecutionListDto })
  @ApiBadRequestResponse({
    description: 'Invalid execution filters or pagination values.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  listExecutions(
    @Query() query: ListExecutionsQuery,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.listExecutions(
      query,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('executions/:id')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary: 'Returns details for a single omnichannel execution.',
  })
  @ApiParam({ name: 'id', type: Number, example: 3001 })
  @ApiOkResponse({ type: OmnichannelExecutionDetailsDto })
  @ApiNotFoundResponse({ description: 'Omnichannel execution not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getExecution(
    @Param('id', ParseIntPipe) executionId: number,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.getExecutionById(
      executionId,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('metrics/channels')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary:
      'Returns request volume and success/error distribution by channel.',
  })
  @ApiOkResponse({ type: ChannelMetricsDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  listChannelMetrics(
    @Query() query: GetChannelMetricsQuery,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.listChannelMetrics(
      query,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('metrics/latency')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary: 'Returns average and p95 latency metrics grouped by channel.',
  })
  @ApiOkResponse({ type: LatencyMetricsDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getLatencyMetrics(
    @Query() query: GetLatencyMetricsQuery,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.getLatencyMetrics(
      query,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('metrics/rag-usage')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary: 'Returns RAG usage distribution across omnichannel executions.',
  })
  @ApiOkResponse({ type: RagUsageMetricsDto })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getRagUsageMetrics(
    @Query() query: GetRagUsageQuery,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.queryService.getRagUsageMetrics(
      query,
      this.resolveTenant(tenantIdHeader),
    );
  }

  @Get('connectors')
  @RequiredScopes('omnichannel:read')
  @ApiOperation({
    summary:
      'Returns connector availability and health status for omnichannel channels.',
  })
  @ApiOkResponse({ type: ConnectorDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  listConnectors(@Query() query: ListConnectorsQuery) {
    return this.queryService.listConnectors(query);
  }

  @Patch('connectors/:id/toggle')
  @RequiredScopes('omnichannel:write')
  @ApiOperation({
    summary: 'Enables or disables an omnichannel connector.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: ToggleConnectorRequest })
  @ApiOkResponse({ type: ConnectorDto })
  @ApiBadRequestResponse({ description: 'Invalid toggle payload.' })
  @ApiNotFoundResponse({ description: 'Connector not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  toggleConnector(
    @Param('id', ParseIntPipe) connectorId: number,
    @Body() dto: ToggleConnectorRequest,
  ) {
    return this.connectorService.toggle(connectorId, dto);
  }

  private resolveTenant(tenantIdHeader?: string): string {
    return this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
    });
  }
}
