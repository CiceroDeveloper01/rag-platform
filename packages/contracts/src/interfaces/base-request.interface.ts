import { Channel } from "../enums/channel.enum";

export interface BaseRequest {
  channel: Channel;
  externalMessageId: string;
}
