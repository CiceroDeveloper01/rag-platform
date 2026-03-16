import { Channel } from "../enums/channel.enum";
import { AttachmentPayload } from "../events/channel-message.event";

export interface RegisterDocumentRequest {
  channel: Channel;
  externalMessageId: string;
  from: string;
  subject?: string;
  body: string;
  attachments: AttachmentPayload[];
}
