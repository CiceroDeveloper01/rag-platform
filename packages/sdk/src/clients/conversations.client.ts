import { ConversationsReplyRequest } from "@rag-platform/contracts";
import { InternalApiClient } from "../api/internal-api.client";

export class ConversationsClient {
  constructor(
    private readonly apiClient: InternalApiClient,
    private readonly path = "/conversations/reply",
  ) {}

  replyConversation<TResponse = unknown>(
    payload: ConversationsReplyRequest,
  ): Promise<TResponse> {
    return this.apiClient.post<ConversationsReplyRequest, TResponse>(
      this.path,
      payload,
    );
  }
}
