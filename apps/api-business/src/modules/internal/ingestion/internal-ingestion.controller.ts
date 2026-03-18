import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalServiceAuthGuard } from '../../../common/auth/guards/internal-service-auth.guard';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { CompleteDocumentIngestionRequest } from './dtos/request/complete-document-ingestion.request';
import { FailDocumentIngestionRequest } from './dtos/request/fail-document-ingestion.request';
import { InternalIngestionService } from './internal-ingestion.service';
import { RequestDocumentIngestionRequest } from './dtos/request/request-document-ingestion.request';
import { StartDocumentIngestionRequest } from './dtos/request/start-document-ingestion.request';
import { UpdateDocumentIngestionStatusRequest } from './dtos/request/update-document-ingestion-status.request';

@ApiExcludeController()
@Controller(['ingestion', 'api/v1/internal/ingestion'])
@UseGuards(InternalServiceAuthGuard, ServiceScopesGuard)
export class InternalIngestionController {
  constructor(
    private readonly internalIngestionService: InternalIngestionService,
  ) {}

  @Post('complete')
  @ServiceScopes('internal:ingestion:write')
  complete(@Body() dto: CompleteDocumentIngestionRequest) {
    return this.internalIngestionService.complete(dto);
  }

  @Post('fail')
  @ServiceScopes('internal:ingestion:write')
  fail(@Body() dto: FailDocumentIngestionRequest) {
    return this.internalIngestionService.fail(dto);
  }

  @Post('start')
  @ServiceScopes('internal:ingestion:write')
  start(@Body() dto: StartDocumentIngestionRequest) {
    return this.internalIngestionService.start(dto);
  }

  @Post('status')
  @ServiceScopes('internal:ingestion:write')
  updateStatus(@Body() dto: UpdateDocumentIngestionStatusRequest) {
    return this.internalIngestionService.updateStatus(dto);
  }

  @Post('request')
  @ServiceScopes('internal:ingestion:write')
  request(@Body() dto: RequestDocumentIngestionRequest) {
    return this.internalIngestionService.request(dto);
  }
}
