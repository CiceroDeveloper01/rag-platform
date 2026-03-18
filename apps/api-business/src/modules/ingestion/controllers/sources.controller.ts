import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { SessionOrInternalAuthGuard } from '../../../common/auth/guards/session-or-internal-auth.guard';
import { DocumentStatusQueryRequest } from '../dtos/request/document-status-query.request';
import { ListSourcesRequest } from '../dtos/request/list-sources.request';
import { UpdateSourceRequest } from '../dtos/request/update-source.request';
import { SourcesService } from '../services/sources.service';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['sources', 'api/v1/sources'])
@UseGuards(SessionOrInternalAuthGuard, ServiceScopesGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ServiceScopes('business:documents:read')
  @ApiOperation({
    summary: 'Returns source documents tracked by the ingestion pipeline.',
  })
  @ApiOkResponse({ description: 'Source list returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  list(@Query() query: ListSourcesRequest) {
    return this.sourcesService.list(query);
  }

  @Get('status')
  @ServiceScopes('business:documents:read')
  @ApiOperation({
    summary: 'Returns source documents with persisted ingestion status fields.',
  })
  @ApiOkResponse({ description: 'Source status list returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  listStatuses(@Query() query: DocumentStatusQueryRequest) {
    return this.sourcesService.listDocumentStatuses(query);
  }

  @Get(':id/status')
  @ServiceScopes('business:documents:read')
  @ApiOperation({
    summary: 'Returns the persisted ingestion status for a source document.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Source status returned successfully.' })
  @ApiNotFoundResponse({ description: 'Source not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getStatus(@Param('id', ParseIntPipe) sourceId: number) {
    return this.sourcesService.getDocumentStatus(sourceId);
  }

  @Patch(':id')
  @ServiceScopes('business:documents:write')
  @ApiOperation({
    summary: 'Updates source metadata such as filename or status flags.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateSourceRequest })
  @ApiOkResponse({ description: 'Source updated successfully.' })
  @ApiNotFoundResponse({ description: 'Source not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  update(
    @Param('id', ParseIntPipe) sourceId: number,
    @Body() dto: UpdateSourceRequest,
  ) {
    return this.sourcesService.update(sourceId, dto);
  }

  @Delete(':id')
  @ServiceScopes('business:documents:write')
  @ApiOperation({
    summary: 'Deletes a source and its associated derived data when supported.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Source deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Source not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  remove(@Param('id', ParseIntPipe) sourceId: number) {
    return this.sourcesService.delete(sourceId);
  }

  @Post(':id/replay')
  @ServiceScopes('business:documents:write')
  @ApiOperation({
    summary: 'Replays a failed document ingestion by republishing it to RabbitMQ.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Replay requested successfully.' })
  @ApiNotFoundResponse({ description: 'Source not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  replay(@Param('id', ParseIntPipe) sourceId: number) {
    return this.sourcesService.replay(sourceId);
  }
}
