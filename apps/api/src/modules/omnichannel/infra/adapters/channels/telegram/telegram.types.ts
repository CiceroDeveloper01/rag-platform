export interface TelegramUpdatePayload {
  update_id: number;
  message: {
    message_id: number;
    date: number;
    text: string;
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    from?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
  metadata?: Record<string, unknown>;
}
