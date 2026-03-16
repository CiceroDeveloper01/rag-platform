import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TelegramWebhookDto } from '../../application/dto/telegram-webhook.dto';
import { TelegramWebhookService } from '../../application/services/telegram-webhook.service';

@ApiTags('Omnichannel')
@Controller('api/v1/omnichannel/telegram')
export class TelegramWebhookController {
  constructor(
    private readonly telegramWebhookService: TelegramWebhookService,
  ) {}

  @Post('webhook')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Receives Telegram webhook updates and forwards them to the omnichannel orchestrator.',
  })
  @ApiHeader({
    name: 'x-telegram-bot-api-secret-token',
    required: false,
    description:
      'Optional Telegram webhook secret token used for request verification.',
  })
  @ApiBody({ type: TelegramWebhookDto })
  @ApiOkResponse({ description: 'Telegram update accepted and processed.' })
  @ApiBadRequestResponse({ description: 'Invalid Telegram update payload.' })
  handleWebhook(
    @Body() dto: TelegramWebhookDto,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    return this.telegramWebhookService.handleWebhook(dto, secret);
  }
}
