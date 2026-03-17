import { Body, Controller, Headers, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SearchRequest } from '../dtos/request/search.request';
import { SearchResponse } from '../dtos/response/search.response';
import { SearchService } from '../services/search.service';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';

@ApiTags('RAG')
@Controller(['search', 'api/v1/search'])
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Performs semantic vector search against indexed RAG documents.',
  })
  @ApiBody({ type: SearchRequest })
  @ApiOkResponse({
    description: 'Semantic search executed successfully.',
    type: SearchResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid semantic search payload.' })
  search(
    @Body() dto: SearchRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: dto.tenantId,
    });

    return this.searchService.search(dto, tenantId);
  }
}
