import { registerAs } from '@nestjs/config';

export const memoryConfig = registerAs('memory', () => ({
  retentionDays: Number(process.env.MEMORY_RETENTION_DAYS ?? 30),
  maxMessageChars: Number(process.env.MEMORY_MAX_MESSAGE_CHARS ?? 4000),
  maxMessagesPerConversation: Number(
    process.env.MEMORY_MAX_MESSAGES_PER_CONVERSATION ?? 200,
  ),
  recentLimit: Number(process.env.MEMORY_RECENT_LIMIT ?? 8),
  semanticLimit: Number(process.env.MEMORY_SEMANTIC_LIMIT ?? 5),
}));
