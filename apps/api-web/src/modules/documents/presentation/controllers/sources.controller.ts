import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequiredScopes } from '../../../../common/decorators/required-scopes.decorator';
import { SessionAuthGuard } from '../../../auth/guards/session-auth.guard';
import { ScopesGuard } from '../../../auth/guards/scopes.guard';
import { DocumentsProxyService } from '../../application/services/documents-proxy.service';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['sources', 'api/v1/sources'])
@UseGuards(SessionAuthGuard, ScopesGuard)
export class SourcesController {
  constructor(private readonly documentsProxyService: DocumentsProxyService) {}

  @Get()
  @RequiredScopes('documents:read')
  @ApiOperation({ summary: 'Returns source records through the portal BFF.' })
  @ApiOkResponse({ description: 'Sources returned successfully.' })
  list(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Headers('cookie') cookieHeader?: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.documentsProxyService.listSources(
      {
        q,
        type,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        order,
      },
      {
        cookieHeader,
        requestId,
        tenantId,
      },
    );
  }

  @Patch(':id')
  @RequiredScopes('documents:write')
  @ApiOperation({ summary: 'Updates source metadata through the portal BFF.' })
  @ApiOkResponse({ description: 'Source updated successfully.' })
  update(
    @Param('id', ParseIntPipe) sourceId: number,
    @Body() payload: Record<string, unknown>,
    @Headers('cookie') cookieHeader?: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.documentsProxyService.updateSource(sourceId, payload, {
      cookieHeader,
      requestId,
      tenantId,
    });
  }

  @Delete(':id')
  @RequiredScopes('documents:write')
  @ApiOperation({ summary: 'Deletes a source through the portal BFF.' })
  @ApiOkResponse({ description: 'Source deleted successfully.' })
  remove(
    @Param('id', ParseIntPipe) sourceId: number,
    @Headers('cookie') cookieHeader?: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.documentsProxyService.deleteSource(sourceId, {
      cookieHeader,
      requestId,
      tenantId,
    });
  }
}
