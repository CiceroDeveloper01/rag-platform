export const FEATURE_FLAGS = {
  RAG: 'rag',
  TELEGRAM: 'telegram',
  EMAIL: 'email',
  LIVE_ACTIVITY: 'live_activity',
  AI_USAGE_POLICY: 'ai_usage_policy',
  RETRIEVAL_CACHE: 'retrieval_cache',
  DASHBOARD: 'dashboard',
} as const;

export type FeatureFlagName =
  (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
