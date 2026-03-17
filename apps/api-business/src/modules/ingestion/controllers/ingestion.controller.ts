import {
  HttpCode,
  HttpStatus,
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
  ApiAcceptedResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { IngestionService } from '../services/ingestion.service';
import { UploadDocumentRequest } from '../dtos/request/upload-document.request';

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
      'Uploads a supported document, validates it, stores the original file, and queues asynchronous ingestion.',
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
  @ApiAcceptedResponse({
    description: 'Document upload accepted and queued for asynchronous ingestion.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid upload payload or unsupported file type.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentRequest,
  ) {
    return this.ingestionService.ingestUploadedFile(file, dto);
  }
}
