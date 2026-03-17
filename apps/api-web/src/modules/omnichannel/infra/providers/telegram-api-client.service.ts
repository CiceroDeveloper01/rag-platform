import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

interface TelegramSendMessageRequest {
  chatId: string;
  text: string;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat?: {
      id: number;
    };
  };
  description?: string;
}

@Injectable()
export class TelegramApiClient {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramApiClient.name);
  }

  async sendMessage(
    request: TelegramSendMessageRequest,
  ): Promise<TelegramSendMessageResponse> {
    const token = this.configService.get<string>(
      'omnichannel.telegram.botToken',
      '',
    );

    if (!token) {
      throw new ServiceUnavailableException(
        'Telegram bot token is not configured',
      );
    }

    const parseMode = this.configService.get<string>(
      'omnichannel.telegram.defaultParseMode',
      'Markdown',
    );

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: request.chatId,
          text: request.text,
          parse_mode: parseMode,
        }),
      },
    );

    const payload = (await response.json()) as TelegramSendMessageResponse;

    if (!response.ok || !payload.ok) {
      this.logger.error(
        {
          statusCode: response.status,
          description: payload.description ?? 'telegram_transport_failed',
        },
        'Telegram API sendMessage failed',
      );
      throw new ServiceUnavailableException(
        payload.description ?? 'Telegram sendMessage failed',
      );
    }

    return payload;
  }
}
