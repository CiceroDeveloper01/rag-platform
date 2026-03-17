import { registerAs } from '@nestjs/config';

export const aiConfig = registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  embeddingModel:
    process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
  llmModel: process.env.OPENAI_LLM_MODEL ?? 'gpt-4o-mini',
  llmTimeoutMs: Number.parseInt(process.env.LLM_TIMEOUT_MS ?? '30000', 10),
  maxPromptTokens: Number.parseInt(
    process.env.AI_MAX_PROMPT_TOKENS ?? '4000',
    10,
  ),
  maxCompletionTokens: Number.parseInt(
    process.env.AI_MAX_COMPLETION_TOKENS ?? '1000',
    10,
  ),
  maxMessageCharacters: Number.parseInt(
    process.env.MAX_MESSAGE_CHARACTERS ?? '2000',
    10,
  ),
  maxRequestsPerMinute: Number.parseInt(
    process.env.MAX_AI_REQUESTS_PER_MINUTE ?? '30',
    10,
  ),
}));
