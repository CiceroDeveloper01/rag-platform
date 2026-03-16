import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalMemoryService } from './internal-memory.service';
import { QueryMemoryContextDto } from './query-memory-context.dto';
import { StoreMemoryDto } from './store-memory.dto';

@ApiExcludeController()
@Controller(['memory', 'api/v1/internal/memory'])
export class InternalMemoryController {
  constructor(private readonly internalMemoryService: InternalMemoryService) {}

  @Post('messages')
  store(@Body() dto: StoreMemoryDto) {
    return this.internalMemoryService.store(dto);
  }

  @Post('context')
  queryContext(@Body() dto: QueryMemoryContextDto) {
    return this.internalMemoryService.queryContext(dto);
  }
}
