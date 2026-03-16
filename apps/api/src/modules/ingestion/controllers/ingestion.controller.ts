import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { IngestionService } from '../services/ingestion.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';

@ApiTags('Documents', 'RAG')
@ApiCookieAuth('rag_platform_session')
@Controller(['ingestion', 'api/v1/ingestion'])
@UseGuards(SessionAuthGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('upload')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Uploads a supported document, validates it, stores the original file, generates chunks and embeddings, and persists the results.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        chunkSize: { type: 'number', example: 500 },
        chunkOverlap: { type: 'number', example: 50 },
        metadata: { type: 'string', example: '{"category":"handbook"}' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: 'Document uploaded and ingested successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid upload payload or unsupported file type.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.ingestionService.ingestUploadedFile(file, dto);
  }
}
