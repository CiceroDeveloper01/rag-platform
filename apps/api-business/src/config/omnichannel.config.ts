import { registerAs } from '@nestjs/config';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

export const omnichannelConfig = registerAs('omnichannel', () => ({
  enabled: toBoolean(process.env.OMNICHANNEL_ENABLED, true),
  apiRuntimeEnabled: toBoolean(
    process.env.OMNICHANNEL_API_RUNTIME_ENABLED,
    false,
  ),
  defaultAgent: process.env.OMNICHANNEL_DEFAULT_AGENT ?? 'rag-agent',
  alwaysUseRag: toBoolean(process.env.OMNICHANNEL_ALWAYS_USE_RAG, false),
  autoResponse: toBoolean(process.env.OMNICHANNEL_AUTO_RESPONSE, true),
  ragKeywords: (
    process.env.OMNICHANNEL_RAG_KEYWORDS ??
    'buscar,documento,manual,politica,base de conhecimento,knowledge base'
  )
    .split(',')
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean),
}));
