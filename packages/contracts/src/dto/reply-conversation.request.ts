import { BaseRequest } from "../interfaces/base-request.interface";

export interface ReplyConversationRequest extends BaseRequest {
  body: string;
}
