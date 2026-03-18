import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  APP_NAME?: string;

  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsOptional()
  @IsString()
  APP_VERSION?: string;

  @IsOptional()
  @IsString()
  API_PREFIX?: string;

  @IsOptional()
  @IsString()
  FRONTEND_ORIGINS?: string;

  @IsOptional()
  @IsString()
  API_BUSINESS_BASE_URL?: string;

  @IsOptional()
  @IsNumberString()
  API_BUSINESS_TIMEOUT_MS?: string;

  @IsOptional()
  @IsBooleanString()
  REDIS_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_API_RUNTIME_ENABLED?: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsNumberString()
  REDIS_PORT?: string;

  @IsOptional()
  @IsString()
  REDIS_USERNAME?: string;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsNumberString()
  REDIS_DB?: string;

  @IsOptional()
  @IsNumberString()
  REDIS_TTL_DEFAULT?: string;

  @IsOptional()
  @IsIn(['local', 's3', 'azure', 'gcs'])
  STORAGE_PROVIDER?: string;

  @IsOptional()
  @IsString()
  LOCAL_STORAGE_PATH?: string;

  @IsOptional()
  @IsString()
  LOCAL_STORAGE_BASE_URL?: string;

  @IsOptional()
  @IsString()
  S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  S3_REGION?: string;

  @IsOptional()
  @IsString()
  S3_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  S3_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  S3_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  AZURE_BLOB_CONTAINER?: string;

  @IsOptional()
  @IsString()
  AZURE_BLOB_CONNECTION_STRING?: string;

  @IsOptional()
  @IsString()
  AZURE_BLOB_ACCOUNT_URL?: string;

  @IsOptional()
  @IsString()
  GCS_BUCKET?: string;

  @IsOptional()
  @IsString()
  GCS_PROJECT_ID?: string;

  @IsOptional()
  @IsString()
  GCS_KEY_FILENAME?: string;

  @IsOptional()
  @IsString()
  GCS_PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsNumberString()
  MAX_DOCUMENT_SIZE_MB?: string;

  @IsOptional()
  @IsString()
  ALLOWED_DOCUMENT_TYPES?: string;

  @IsOptional()
  @IsNumberString()
  AUTH_SESSION_TTL_HOURS?: string;

  @IsOptional()
  @IsString()
  AUTH_SESSION_COOKIE_NAME?: string;

  @IsOptional()
  @IsString()
  AUTH_USER_JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  AUTH_USER_JWT_ISSUER?: string;

  @IsOptional()
  @IsString()
  AUTH_USER_JWT_AUDIENCE?: string;

  @IsOptional()
  @IsNumberString()
  AUTH_USER_JWT_TTL_MINUTES?: string;

  @IsOptional()
  @IsString()
  INTERNAL_SERVICE_TOKEN_SECRET?: string;

  @IsOptional()
  @IsString()
  INTERNAL_SERVICE_TOKEN_ISSUER?: string;

  @IsOptional()
  @IsString()
  INTERNAL_SERVICE_TOKEN_AUDIENCE?: string;

  @IsOptional()
  @IsString()
  INTERNAL_SERVICE_SUBJECT?: string;

  @IsOptional()
  @IsString()
  INTERNAL_SERVICE_DEFAULT_SCOPES?: string;

  @IsOptional()
  @IsNumberString()
  INTERNAL_SERVICE_TOKEN_TTL_SECONDS?: string;

  @IsOptional()
  @IsBooleanString()
  AUTH_SECURE_COOKIES?: string;

  @IsOptional()
  @IsNumberString()
  AUTH_RATE_LIMIT_TTL_MS?: string;

  @IsOptional()
  @IsNumberString()
  AUTH_RATE_LIMIT_LIMIT?: string;

  @IsOptional()
  @IsString()
  DEMO_USER_EMAIL?: string;

  @IsOptional()
  @IsString()
  DEMO_USER_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DEMO_USER_NAME?: string;

  @IsOptional()
  @IsBooleanString()
  DATABASE_ENABLED?: string;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsString()
  DATABASE_HOST?: string;

  @IsOptional()
  @IsNumberString()
  DB_PORT?: string;

  @IsOptional()
  @IsNumberString()
  DATABASE_PORT?: string;

  @IsOptional()
  @IsString()
  DB_USERNAME?: string;

  @IsOptional()
  @IsString()
  DATABASE_USER?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DATABASE_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DB_NAME?: string;

  @IsOptional()
  @IsString()
  DATABASE_NAME?: string;

  @IsOptional()
  @IsString()
  DB_SCHEMA?: string;

  @IsOptional()
  @IsBooleanString()
  DB_SSL?: string;

  @IsOptional()
  @IsBooleanString()
  DB_SYNCHRONIZE?: string;

  @IsOptional()
  @IsBooleanString()
  DB_LOGGING?: string;

  @IsOptional()
  @IsNumberString()
  MEMORY_RETENTION_DAYS?: string;

  @IsOptional()
  @IsNumberString()
  MEMORY_MAX_MESSAGE_CHARS?: string;

  @IsOptional()
  @IsNumberString()
  MEMORY_MAX_MESSAGES_PER_CONVERSATION?: string;

  @IsOptional()
  @IsNumberString()
  MEMORY_RECENT_LIMIT?: string;

  @IsOptional()
  @IsNumberString()
  MEMORY_SEMANTIC_LIMIT?: string;

  @IsOptional()
  @IsString()
  METRICS_PREFIX?: string;

  @IsOptional()
  @IsBooleanString()
  METRICS_DEFAULTS_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  OTEL_ENABLED?: string;

  @IsOptional()
  @IsString()
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  OTEL_SERVICE_NAME?: string;

  @IsOptional()
  @IsString()
  OTEL_SERVICE_VERSION?: string;

  @IsOptional()
  @IsString()
  OTEL_RESOURCE_ATTRIBUTES?: string;

  @IsOptional()
  @IsBooleanString()
  LOG_REDACT_ENABLED?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @IsBooleanString()
  LOG_PRETTY?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;

  @IsOptional()
  @IsString()
  OPENAI_EMBEDDING_MODEL?: string;

  @IsOptional()
  @IsString()
  OPENAI_LLM_MODEL?: string;

  @IsOptional()
  @IsNumberString()
  LLM_TIMEOUT_MS?: string;

  @IsOptional()
  @IsNumberString()
  AI_MAX_PROMPT_TOKENS?: string;

  @IsOptional()
  @IsNumberString()
  AI_MAX_COMPLETION_TOKENS?: string;

  @IsOptional()
  @IsNumberString()
  MAX_MESSAGE_CHARACTERS?: string;

  @IsOptional()
  @IsNumberString()
  MAX_AI_REQUESTS_PER_MINUTE?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_RAG_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_TELEGRAM_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_EMAIL_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_LIVE_ACTIVITY_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_AI_USAGE_POLICY_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_RETRIEVAL_CACHE_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  FEATURE_DASHBOARD_ENABLED?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_ENABLED?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_DEFAULT_AGENT?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_RAG_KEYWORDS?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_ALWAYS_USE_RAG?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_AUTO_RESPONSE?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_TELEGRAM_ENABLED?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_TELEGRAM_BOT_TOKEN?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_TELEGRAM_WEBHOOK_SECRET?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_TELEGRAM_DEFAULT_PARSE_MODE?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_EMAIL_ENABLED?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_EMAIL_PROVIDER?: string;

  @IsOptional()
  @IsString()
  OMNICHANNEL_EMAIL_FROM?: string;

  @IsOptional()
  @IsBooleanString()
  OMNICHANNEL_EMAIL_DEV_MODE?: string;

  @IsOptional()
  @IsString()
  EMAIL_PROVIDER?: string;

  @IsOptional()
  @IsString()
  EMAIL_IMAP_HOST?: string;

  @IsOptional()
  @IsNumberString()
  EMAIL_IMAP_PORT?: string;

  @IsOptional()
  @IsBooleanString()
  EMAIL_IMAP_SECURE?: string;

  @IsOptional()
  @IsString()
  EMAIL_SMTP_HOST?: string;

  @IsOptional()
  @IsNumberString()
  EMAIL_SMTP_PORT?: string;

  @IsOptional()
  @IsBooleanString()
  EMAIL_SMTP_SECURE?: string;

  @IsOptional()
  @IsString()
  EMAIL_USERNAME?: string;

  @IsOptional()
  @IsString()
  EMAIL_PASSWORD?: string;

  @IsOptional()
  @IsNumberString()
  EMAIL_POLL_INTERVAL_SECONDS?: string;

  @IsOptional()
  @IsString()
  EMAIL_INBOX?: string;

  @IsOptional()
  @IsString()
  EMAIL_FROM_ADDRESS?: string;

  @IsOptional()
  @IsNumberString()
  EMAIL_MAX_ATTACHMENT_MB?: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
