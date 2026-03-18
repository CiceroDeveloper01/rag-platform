import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalServiceAuthGuard } from '../../../common/auth/guards/internal-service-auth.guard';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { InternalDocumentsService } from './internal-documents.service';
import { RegisterDocumentRequest } from './dtos/request/register-document.request';

@ApiExcludeController()
@Controller(['documents', 'api/v1/internal/documents'])
@UseGuards(InternalServiceAuthGuard, ServiceScopesGuard)
export class InternalDocumentsController {
  constructor(
    private readonly internalDocumentsService: InternalDocumentsService,
  ) {}

  @Post('register')
  @ServiceScopes('internal:documents:write')
  register(@Body() dto: RegisterDocumentRequest) {
    return this.internalDocumentsService.register(dto);
  }
}
