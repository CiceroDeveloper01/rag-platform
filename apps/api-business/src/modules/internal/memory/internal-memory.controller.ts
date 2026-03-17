import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalMemoryService } from './internal-memory.service';
import { QueryMemoryContextRequest } from './dtos/request/query-memory-context.request';
import { StoreMemoryRequest } from './dtos/request/store-memory.request';

@ApiExcludeController()
@Controller(['memory', 'api/v1/internal/memory'])
export class InternalMemoryController {
  constructor(private readonly internalMemoryService: InternalMemoryService) {}

  @Post('messages')
  store(@Body() dto: StoreMemoryRequest) {
    return this.internalMemoryService.store(dto);
  }

  @Post('context')
  queryContext(@Body() dto: QueryMemoryContextRequest) {
    return this.internalMemoryService.queryContext(dto);
  }
}
