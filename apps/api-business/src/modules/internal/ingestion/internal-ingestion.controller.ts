import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { CompleteDocumentIngestionRequest } from './dtos/request/complete-document-ingestion.request';
import { FailDocumentIngestionRequest } from './dtos/request/fail-document-ingestion.request';
import { InternalIngestionService } from './internal-ingestion.service';
import { RequestDocumentIngestionRequest } from './dtos/request/request-document-ingestion.request';
import { StartDocumentIngestionRequest } from './dtos/request/start-document-ingestion.request';
import { UpdateDocumentIngestionStatusRequest } from './dtos/request/update-document-ingestion-status.request';

@ApiExcludeController()
@Controller(['ingestion', 'api/v1/internal/ingestion'])
export class InternalIngestionController {
  constructor(
    private readonly internalIngestionService: InternalIngestionService,
  ) {}

  @Post('complete')
  complete(@Body() dto: CompleteDocumentIngestionRequest) {
    return this.internalIngestionService.complete(dto);
  }

  @Post('fail')
  fail(@Body() dto: FailDocumentIngestionRequest) {
    return this.internalIngestionService.fail(dto);
  }

  @Post('start')
  start(@Body() dto: StartDocumentIngestionRequest) {
    return this.internalIngestionService.start(dto);
  }

  @Post('status')
  updateStatus(@Body() dto: UpdateDocumentIngestionStatusRequest) {
    return this.internalIngestionService.updateStatus(dto);
  }

  @Post('request')
  request(@Body() dto: RequestDocumentIngestionRequest) {
    return this.internalIngestionService.request(dto);
  }
}
