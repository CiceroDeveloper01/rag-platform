import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalServiceAuthGuard } from '../../../common/auth/guards/internal-service-auth.guard';
import { ServiceScopesGuard } from '../../../common/auth/guards/service-scopes.guard';
import { ServiceScopes } from '../../../common/decorators/service-scopes.decorator';
import { CreateHandoffRequest } from './dtos/request/create-handoff.request';
import { InternalHandoffService } from './internal-handoff.service';

@ApiExcludeController()
@Controller(['handoff', 'api/v1/internal/handoff'])
@UseGuards(InternalServiceAuthGuard, ServiceScopesGuard)
export class InternalHandoffController {
  constructor(
    private readonly internalHandoffService: InternalHandoffService,
  ) {}

  @Post()
  @ServiceScopes('internal:handoff:write')
  create(@Body() dto: CreateHandoffRequest) {
    return this.internalHandoffService.createHandoff(dto);
  }
}
