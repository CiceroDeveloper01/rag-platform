import {
  ConversationsReplyRequest,
  ConversationsReplyResponse,
} from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";
import { ConversationsClient } from "../clients/conversations.client";

export class ConversationsInternalClient {
  private readonly client: ConversationsClient;

  constructor(apiClient: InternalApiClient, path = "/conversations/reply") {
    this.client = new ConversationsClient(apiClient, path);
  }

  reply(
    payload: ConversationsReplyRequest,
  ): Promise<ConversationsReplyResponse> {
    return this.client.replyConversation<ConversationsReplyResponse>(payload);
  }
}
