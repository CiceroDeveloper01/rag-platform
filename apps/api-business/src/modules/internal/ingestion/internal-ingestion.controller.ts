import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { CompleteDocumentIngestionDto } from './complete-document-ingestion.dto';
import { FailDocumentIngestionDto } from './fail-document-ingestion.dto';
import { InternalIngestionService } from './internal-ingestion.service';

@ApiExcludeController()
@Controller(['ingestion', 'api/v1/internal/ingestion'])
export class InternalIngestionController {
  constructor(
    private readonly internalIngestionService: InternalIngestionService,
  ) {}

  @Post('complete')
  complete(@Body() dto: CompleteDocumentIngestionDto) {
    return this.internalIngestionService.complete(dto);
  }

  @Post('fail')
  fail(@Body() dto: FailDocumentIngestionDto) {
    return this.internalIngestionService.fail(dto);
  }
}
