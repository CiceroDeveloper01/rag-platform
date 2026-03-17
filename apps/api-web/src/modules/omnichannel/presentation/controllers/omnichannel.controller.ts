import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SessionAuthGuard } from '../../../auth/guards/session-auth.guard';
import { ProcessOmnichannelMessageRequest } from '../../application/dtos/request/process-omnichannel-message.request';
import { OmnichannelOrchestratorService } from '../../application/services/omnichannel-orchestrator.service';

@ApiTags('Omnichannel')
@ApiCookieAuth('rag_platform_session')
@Controller('api/v1/omnichannel')
@UseGuards(SessionAuthGuard)
export class OmnichannelController {
  constructor(
    private readonly orchestratorService: OmnichannelOrchestratorService,
  ) {}

  @Post('dev/process')
  @ApiOperation({
    summary:
      'Processes a normalized omnichannel payload through the orchestrator for development and testing.',
  })
  @ApiBody({ type: ProcessOmnichannelMessageRequest })
  @ApiOkResponse({
    description: 'Normalized inbound message processed successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid omnichannel development payload.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  process(@Body() dto: ProcessOmnichannelMessageRequest) {
    return this.orchestratorService.process(dto);
  }
}
