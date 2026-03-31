import {
  API_BUSINESS_DOMAIN_BOUNDARIES,
  BANKING_CORE_MODULES,
  ORCHESTRATOR_SUPPORT_INTERNAL_MODULES,
} from "./domain-boundaries";
import { PLATFORM_CAPABILITY_GROUPS } from "./platform-capabilities";

describe("api-business domain boundaries", () => {
  it("keeps banking core modules explicit", () => {
    expect(BANKING_CORE_MODULES).toEqual([
      "modules/banking/customer",
      "modules/banking/cards",
      "modules/banking/investments",
      "modules/banking/credit",
    ]);
  });

  it("separates platform capabilities from orchestrator support endpoints", () => {
    expect(API_BUSINESS_DOMAIN_BOUNDARIES.aiPlatformCapabilities).toContain(
      "modules/chat",
    );
    expect(API_BUSINESS_DOMAIN_BOUNDARIES.aiPlatformCapabilities).toContain(
      "modules/ingestion",
    );
    expect(ORCHESTRATOR_SUPPORT_INTERNAL_MODULES).toContain(
      "modules/internal/handoff",
    );
  });

  it("exposes grouped capability metadata", () => {
    expect(PLATFORM_CAPABILITY_GROUPS.bankingCore.modules).toBe(
      BANKING_CORE_MODULES,
    );
    expect(PLATFORM_CAPABILITY_GROUPS.aiPlatformCapabilities.purpose).toContain(
      "Reusable AI and platform capabilities",
    );
  });
});
