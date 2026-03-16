import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { QueryMemoryContextDto } from '../dto/query-memory-context.dto';
import { StoreMemoryDto } from '../dto/store-memory.dto';
import { InternalMemoryService } from '../services/internal-memory.service';

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
