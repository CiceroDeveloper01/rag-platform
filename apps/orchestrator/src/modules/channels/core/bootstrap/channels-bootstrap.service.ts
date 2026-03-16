import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { AppLoggerService } from "@rag-platform/observability";
import { ChannelListener } from "../interfaces/channel-listener.interface";
import { CHANNEL_LISTENERS } from "./channel-listeners.token";

@Injectable()
export class ChannelsBootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly logger: AppLoggerService,
    @Inject(CHANNEL_LISTENERS)
    private readonly channelListeners: ChannelListener[],
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log(
      "Starting channel listeners",
      ChannelsBootstrapService.name,
    );
    await Promise.all(
      this.channelListeners.map((listener) => listener.start()),
    );
  }
}
