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
import { ProcessOmnichannelMessageDto } from '../../application/dto/process-omnichannel-message.dto';
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
  @ApiBody({ type: ProcessOmnichannelMessageDto })
  @ApiOkResponse({
    description: 'Normalized inbound message processed successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid omnichannel development payload.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  process(@Body() dto: ProcessOmnichannelMessageDto) {
    return this.orchestratorService.process(dto);
  }
}
