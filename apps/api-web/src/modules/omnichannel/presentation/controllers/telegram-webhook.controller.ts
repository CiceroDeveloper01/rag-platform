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
import { TelegramWebhookRequest } from '../../application/dtos/request/telegram-webhook.request';
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
  @ApiBody({ type: TelegramWebhookRequest })
  @ApiOkResponse({ description: 'Telegram update accepted and processed.' })
  @ApiBadRequestResponse({ description: 'Invalid Telegram update payload.' })
  handleWebhook(
    @Body() dto: TelegramWebhookRequest,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    return this.telegramWebhookService.handleWebhook(dto, secret);
  }
}
