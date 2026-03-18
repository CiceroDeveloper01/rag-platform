import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalDocumentsService } from './internal-documents.service';
import { RegisterDocumentRequest } from './dtos/request/register-document.request';

@ApiExcludeController()
@Controller(['documents', 'api/v1/internal/documents'])
export class InternalDocumentsController {
  constructor(
    private readonly internalDocumentsService: InternalDocumentsService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDocumentRequest) {
    return this.internalDocumentsService.register(dto);
  }
}
