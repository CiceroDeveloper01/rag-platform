export interface ConversationMessageRecord {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface ConversationRecord {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessageRecord[];
}
