import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalDocumentsService } from './internal-documents.service';
import { RegisterDocumentDto } from './register-document.dto';

@ApiExcludeController()
@Controller(['documents', 'api/v1/internal/documents'])
export class InternalDocumentsController {
  constructor(
    private readonly internalDocumentsService: InternalDocumentsService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDocumentDto) {
    return this.internalDocumentsService.register(dto);
  }
}
