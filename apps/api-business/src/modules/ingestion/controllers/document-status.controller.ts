import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { DocumentStatusQueryRequest } from '../dtos/request/document-status-query.request';
import { DocumentStatusResponse } from '../dtos/response/document-status.response';
import { SourcesService } from '../services/sources.service';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['documents', 'api/v1/documents'])
@UseGuards(SessionAuthGuard)
export class DocumentStatusController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Returns persisted document ingestion status entries.',
  })
  @ApiOkResponse({
    description: 'Document ingestion statuses returned successfully.',
    type: DocumentStatusResponse,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  list(@Query() query: DocumentStatusQueryRequest) {
    return this.sourcesService.listDocumentStatuses(query);
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Returns the persisted ingestion status for a single document.',
  })
  @ApiParam({ name: 'id', type: Number, example: 42 })
  @ApiOkResponse({
    description: 'Document ingestion status returned successfully.',
    type: DocumentStatusResponse,
  })
  @ApiNotFoundResponse({ description: 'Document processing status not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getById(@Param('id', ParseIntPipe) documentId: number) {
    return this.sourcesService.getDocumentStatus(documentId);
  }
}
