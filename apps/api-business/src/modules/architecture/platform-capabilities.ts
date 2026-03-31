import {
  AI_PLATFORM_CAPABILITY_MODULES,
  BANKING_CORE_MODULES,
  ORCHESTRATOR_SUPPORT_INTERNAL_MODULES,
} from "./domain-boundaries";

export const PLATFORM_CAPABILITY_GROUPS = {
  bankingCore: {
    purpose: "Business capabilities and banking domain contracts.",
    modules: BANKING_CORE_MODULES,
  },
  aiPlatformCapabilities: {
    purpose:
      "Reusable AI and platform capabilities that support retrieval, conversations, ingestion, and runtime support.",
    modules: AI_PLATFORM_CAPABILITY_MODULES,
  },
  orchestratorSupport: {
    purpose:
      "Internal synchronous support endpoints used by the orchestrator and adjacent runtimes.",
    modules: ORCHESTRATOR_SUPPORT_INTERNAL_MODULES,
  },
} as const;
