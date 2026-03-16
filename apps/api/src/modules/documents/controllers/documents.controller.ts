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
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { DocumentsService } from '../services/documents.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { ListDocumentsDto } from '../dto/list-documents.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';

@ApiTags('Documents')
@ApiCookieAuth('rag_platform_session')
@Controller(['documents', 'api/v1/documents'])
@UseGuards(SessionAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Returns paginated document records.' })
  @ApiOkResponse({ description: 'Document list returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  list(
    @Query() query: ListDocumentsDto,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: query.tenantId,
    });

    return this.documentsService.listDocuments({
      ...query,
      tenantId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns a single document by identifier.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Document returned successfully.' })
  @ApiNotFoundResponse({ description: 'Document not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getById(
    @Param('id', ParseIntPipe) documentId: number,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
    });

    return this.documentsService.getDocument(documentId, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Creates a document entry manually.' })
  @ApiBody({ type: CreateDocumentDto })
  @ApiOkResponse({ description: 'Document created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid document payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  create(
    @Body() dto: CreateDocumentDto,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: dto.tenantId,
      metadata: dto.metadata,
    });

    return this.documentsService.createDocument({
      ...dto,
      tenantId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates document content or metadata.' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateDocumentDto })
  @ApiOkResponse({ description: 'Document updated successfully.' })
  @ApiNotFoundResponse({ description: 'Document not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  update(
    @Param('id', ParseIntPipe) documentId: number,
    @Body() dto: UpdateDocumentDto,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: dto.tenantId,
      metadata: dto.metadata,
    });

    return this.documentsService.updateDocument(documentId, {
      ...dto,
      tenantId,
    });
  }

  @Delete(':id')
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
