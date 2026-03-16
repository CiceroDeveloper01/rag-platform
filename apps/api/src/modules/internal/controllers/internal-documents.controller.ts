import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { RegisterDocumentDto } from '../dto/register-document.dto';
import { InternalDocumentsService } from '../services/internal-documents.service';

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
