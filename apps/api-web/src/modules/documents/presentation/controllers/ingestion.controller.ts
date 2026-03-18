import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiAcceptedResponse, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequiredScopes } from '../../../../common/decorators/required-scopes.decorator';
import { SessionAuthGuard } from '../../../auth/guards/session-auth.guard';
import { ScopesGuard } from '../../../auth/guards/scopes.guard';
import { DocumentsProxyService } from '../../application/services/documents-proxy.service';
import { UploadDocumentPortalRequest } from '../dtos/request/upload-document.request';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['ingestion', 'api/v1/ingestion'])
@UseGuards(SessionAuthGuard, ScopesGuard)
export class IngestionController {
  constructor(private readonly documentsProxyService: DocumentsProxyService) {}

  @Post('upload')
  @RequiredScopes('documents:write')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Uploads a document through the portal BFF.' })
  @ApiAcceptedResponse({ description: 'Document upload accepted for async ingestion.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentPortalRequest,
    @Headers('cookie') cookieHeader?: string,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    return this.documentsProxyService.uploadDocument(
      {
        file,
        chunkSize: dto.chunkSize,
        chunkOverlap: dto.chunkOverlap,
        metadata: dto.metadata,
      },
      {
        cookieHeader,
        requestId,
        tenantId,
      },
    );
  }
}
