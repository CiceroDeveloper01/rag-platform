import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Body,
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
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { ListSourcesDto } from '../dto/list-sources.dto';
import { UpdateSourceDto } from '../dto/update-source.dto';
import { SourcesService } from '../services/sources.service';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['sources', 'api/v1/sources'])
@UseGuards(SessionAuthGuard)
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  @ApiOperation({
    summary: 'Returns source documents tracked by the ingestion pipeline.',
  })
  @ApiOkResponse({ description: 'Source list returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  list(@Query() query: ListSourcesDto) {
    return this.sourcesService.list(query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Updates source metadata such as filename or status flags.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateSourceDto })
  @ApiOkResponse({ description: 'Source updated successfully.' })
  @ApiNotFoundResponse({ description: 'Source not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  update(
    @Param('id', ParseIntPipe) sourceId: number,
    @Body() dto: UpdateSourceDto,
  ) {
    return this.sourcesService.update(sourceId, dto);
  }

  @Delete(':id')
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
}
