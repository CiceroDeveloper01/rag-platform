import {
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
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
@Controller(['documents', 'api/v1/documents'])
@UseGuards(SessionAuthGuard, ScopesGuard)
export class DocumentsController {
  constructor(private readonly documentsProxyService: DocumentsProxyService) {}

  @Get('status')
  @RequiredScopes('documents:read')
  @ApiOperation({ summary: 'Returns persisted document ingestion statuses through the BFF.' })
  @ApiOkResponse({ description: 'Document statuses returned successfully.' })
  listStatuses(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Headers('cookie') cookieHeader?: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.documentsProxyService.listDocumentStatuses(
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

  @Get(':id/status')
  @RequiredScopes('documents:read')
  @ApiOperation({ summary: 'Returns a single document ingestion status through the BFF.' })
  @ApiOkResponse({ description: 'Document status returned successfully.' })
  getStatus(
    @Param('id', ParseIntPipe) documentId: number,
    @Headers('cookie') cookieHeader?: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.documentsProxyService.getDocumentStatus(documentId, {
      cookieHeader,
      requestId,
      tenantId,
    });
  }
}
