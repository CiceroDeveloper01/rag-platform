import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  IOutboundDispatcher,
  OutboundDispatchRequest,
  OutboundDispatchResult,
} from '../../application/interfaces/outbound-dispatcher.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { EmailOutboundDispatcher } from '../dispatchers/email-outbound-dispatcher.service';
import { FutureChannelStubDispatcher } from '../dispatchers/future-channel-stub-dispatcher.service';
import { TelegramOutboundDispatcher } from '../dispatchers/telegram-outbound-dispatcher.service';
import { NoopOutboundDispatcher } from './noop-outbound-dispatcher.service';

@Injectable()
export class OutboundDispatcherRegistryService implements IOutboundDispatcher {
  private readonly dispatchers: IOutboundDispatcher[];

  constructor(
    telegramDispatcher: TelegramOutboundDispatcher,
    emailDispatcher: EmailOutboundDispatcher,
    futureChannelDispatcher: FutureChannelStubDispatcher,
    noopDispatcher: NoopOutboundDispatcher,
  ) {
    this.dispatchers = [
      telegramDispatcher,
      emailDispatcher,
      futureChannelDispatcher,
      noopDispatcher,
    ];
  }

  supports(channel: MessageChannel): boolean {
    return this.dispatchers.some((dispatcher) => dispatcher.supports(channel));
  }

  async dispatch(
    request: OutboundDispatchRequest,
  ): Promise<OutboundDispatchResult> {
    const dispatcher = this.dispatchers.find((item) =>
      item.supports(request.channel),
    );

    if (!dispatcher) {
      throw new ServiceUnavailableException(
        `No outbound dispatcher registered for channel ${request.channel}`,
      );
    }

    return dispatcher.dispatch(request);
  }
}
