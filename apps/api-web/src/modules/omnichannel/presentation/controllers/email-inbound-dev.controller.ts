import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EmailInboundDevDto } from '../../application/dto/email-inbound-dev.dto';
import { EmailInboundDevService } from '../../application/services/email-inbound-dev.service';

@ApiTags('Omnichannel')
@Controller('api/v1/omnichannel/email')
export class EmailInboundDevController {
  constructor(
    private readonly emailInboundDevService: EmailInboundDevService,
  ) {}

  @Post('inbound-dev')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Processes a development email payload through the omnichannel orchestrator.',
  })
  @ApiBody({ type: EmailInboundDevDto })
  @ApiOkResponse({
    description: 'Development email payload accepted and processed.',
  })
  @ApiBadRequestResponse({ description: 'Invalid development email payload.' })
  handleInbound(@Body() dto: EmailInboundDevDto) {
    return this.emailInboundDevService.handleInbound(dto);
  }
}
