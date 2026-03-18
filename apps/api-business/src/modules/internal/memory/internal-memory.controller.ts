import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalServiceAuthGuard } from '../../../common/auth/guards/internal-service-auth.guard';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { InternalMemoryService } from './internal-memory.service';
import { QueryMemoryContextRequest } from './dtos/request/query-memory-context.request';
import { StoreMemoryRequest } from './dtos/request/store-memory.request';

@ApiExcludeController()
@Controller(['memory', 'api/v1/internal/memory'])
@UseGuards(InternalServiceAuthGuard, ServiceScopesGuard)
export class InternalMemoryController {
  constructor(private readonly internalMemoryService: InternalMemoryService) {}

  @Post('messages')
  @ServiceScopes('internal:memory:write')
  store(@Body() dto: StoreMemoryRequest) {
    return this.internalMemoryService.store(dto);
  }

  @Post('context')
  @ServiceScopes('internal:memory:write')
  queryContext(@Body() dto: QueryMemoryContextRequest) {
    return this.internalMemoryService.queryContext(dto);
  }
}
