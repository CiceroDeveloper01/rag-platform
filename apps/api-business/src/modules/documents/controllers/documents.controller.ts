import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { SessionOrInternalAuthGuard } from '../../../common/auth/guards/session-or-internal-auth.guard';
import { DocumentsService } from '../services/documents.service';
import { CreateDocumentRequest } from '../dtos/request/create-document.request';
import { ListDocumentsRequest } from '../dtos/request/list-documents.request';
import { UpdateDocumentRequest } from '../dtos/request/update-document.request';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { DocumentResponseMapper } from '../mappers/document-response.mapper';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['documents', 'api/v1/documents'])
@UseGuards(SessionOrInternalAuthGuard, ServiceScopesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly tenantContextService: TenantContextService,
    private readonly documentResponseMapper: DocumentResponseMapper,
  ) {}

  @Get()
  @ServiceScopes('business:documents:read')
  @ApiOperation({ summary: 'Returns paginated document records.' })
  @ApiOkResponse({ description: 'Document list returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async list(
    @Query() query: ListDocumentsRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: query.tenantId,
    });

    return this.documentResponseMapper.toResponseList(
      await this.documentsService.listDocuments({
        ...query,
        tenantId,
      }),
    );
  }

  @Get(':id')
  @ServiceScopes('business:documents:read')
  @ApiOperation({ summary: 'Returns a single document by identifier.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Document returned successfully.' })
  @ApiNotFoundResponse({ description: 'Document not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async getById(
    @Param('id', ParseIntPipe) documentId: number,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
    });

    return this.documentResponseMapper.toResponse(
      await this.documentsService.getDocument(documentId, tenantId),
    );
  }

  @Post()
  @ServiceScopes('business:documents:write')
  @ApiOperation({ summary: 'Creates a document entry manually.' })
  @ApiBody({ type: CreateDocumentRequest })
  @ApiOkResponse({ description: 'Document created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid document payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async create(
    @Body() dto: CreateDocumentRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: dto.tenantId,
      metadata: dto.metadata,
    });

    return this.documentResponseMapper.toResponse(
      await this.documentsService.createDocument({
        ...dto,
        tenantId,
      }),
    );
  }

  @Patch(':id')
  @ServiceScopes('business:documents:write')
  @ApiOperation({ summary: 'Updates document content or metadata.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateDocumentRequest })
  @ApiOkResponse({ description: 'Document updated successfully.' })
  @ApiNotFoundResponse({ description: 'Document not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async update(
    @Param('id', ParseIntPipe) documentId: number,
    @Body() dto: UpdateDocumentRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: dto.tenantId,
      metadata: dto.metadata,
    });

    return this.documentResponseMapper.toResponse(
      await this.documentsService.updateDocument(documentId, {
        ...dto,
        tenantId,
      }),
    );
  }

  @Delete(':id')
  @ServiceScopes('business:documents:write')
  @ApiOperation({ summary: 'Deletes a document record.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Document deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Document not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  remove(
    @Param('id', ParseIntPipe) documentId: number,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
    });

    return this.documentsService.deleteDocument(documentId, tenantId);
  }
}
