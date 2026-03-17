import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { IChannelAdapter } from '../../application/interfaces/channel-adapter.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { NormalizedMessagePayload } from '../../domain/value-objects/normalized-message-payload.value-object';
import { EmailChannelAdapter } from '../adapters/channels/email/email-channel.adapter';
import { RoamChannelAdapterStub } from '../adapters/channels/roam/roam-channel.adapter';
import { SlackChannelAdapterStub } from '../adapters/channels/slack/slack-channel.adapter';
import { SmsChannelAdapterStub } from '../adapters/channels/sms/sms-channel.adapter';
import { TeamsChannelAdapterStub } from '../adapters/channels/teams/teams-channel.adapter';
import { TelegramChannelAdapter } from '../adapters/channels/telegram/telegram-channel.adapter';
import { VoiceChannelAdapterStub } from '../adapters/channels/voice/voice-channel.adapter';
import { WhatsappChannelAdapterStub } from '../adapters/channels/whatsapp/whatsapp-channel.adapter';

@Injectable()
export class DefaultChannelAdapterRegistryService implements IChannelAdapter {
  private readonly adapters: IChannelAdapter[];

  constructor(
    telegramAdapter: TelegramChannelAdapter,
    emailAdapter: EmailChannelAdapter,
    teamsAdapter: TeamsChannelAdapterStub,
    whatsappAdapter: WhatsappChannelAdapterStub,
    slackAdapter: SlackChannelAdapterStub,
    smsAdapter: SmsChannelAdapterStub,
    voiceAdapter: VoiceChannelAdapterStub,
    roamAdapter: RoamChannelAdapterStub,
  ) {
    this.adapters = [
      telegramAdapter,
      emailAdapter,
      teamsAdapter,
      whatsappAdapter,
      slackAdapter,
      smsAdapter,
      voiceAdapter,
      roamAdapter,
    ];
  }

  supports(channel: MessageChannel): boolean {
    return this.adapters.some((adapter) => adapter.supports(channel));
  }

  normalize(input: unknown): NormalizedMessagePayload {
    if (!(input instanceof NormalizedMessagePayload)) {
      throw new Error('This adapter registry expects a normalized payload');
    }

    return input;
  }

  normalizeForChannel(
    channel: MessageChannel,
    input: unknown,
  ): NormalizedMessagePayload {
    const adapter = this.adapters.find((item) => item.supports(channel));

    if (!adapter) {
      throw new ServiceUnavailableException(
        `No channel adapter registered for ${channel}`,
      );
    }

    return adapter.normalize(input);
  }
}
