import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { CreateHandoffDto } from './create-handoff.dto';
import { InternalHandoffService } from './internal-handoff.service';

@ApiExcludeController()
@Controller(['handoff', 'api/v1/internal/handoff'])
export class InternalHandoffController {
  constructor(
    private readonly internalHandoffService: InternalHandoffService,
  ) {}

  @Post()
  create(@Body() dto: CreateHandoffDto) {
    return this.internalHandoffService.createHandoff(dto);
  }
}
