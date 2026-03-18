import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { CreateHandoffRequest } from './dtos/request/create-handoff.request';
import { InternalHandoffService } from './internal-handoff.service';

@ApiExcludeController()
@Controller(['handoff', 'api/v1/internal/handoff'])
export class InternalHandoffController {
  constructor(
    private readonly internalHandoffService: InternalHandoffService,
  ) {}

  @Post()
  create(@Body() dto: CreateHandoffRequest) {
    return this.internalHandoffService.createHandoff(dto);
  }
}
