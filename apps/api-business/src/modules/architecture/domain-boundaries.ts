export const BANKING_CORE_MODULES = [
  "modules/banking/customer",
  "modules/banking/cards",
  "modules/banking/investments",
  "modules/banking/credit",
] as const;

export const AI_PLATFORM_CAPABILITY_MODULES = [
  "modules/chat",
  "modules/search",
  "modules/documents",
  "modules/ingestion",
  "modules/memory",
  "modules/conversations",
] as const;

export const ORCHESTRATOR_SUPPORT_INTERNAL_MODULES = [
  "modules/internal/conversations",
  "modules/internal/documents",
  "modules/internal/handoff",
  "modules/internal/ingestion",
  "modules/internal/memory",
] as const;

export const API_BUSINESS_DOMAIN_BOUNDARIES = {
  bankingCore: BANKING_CORE_MODULES,
  aiPlatformCapabilities: AI_PLATFORM_CAPABILITY_MODULES,
  orchestratorSupport: ORCHESTRATOR_SUPPORT_INTERNAL_MODULES,
} as const;

export type ApiBusinessDomainBoundary =
  keyof typeof API_BUSINESS_DOMAIN_BOUNDARIES;
