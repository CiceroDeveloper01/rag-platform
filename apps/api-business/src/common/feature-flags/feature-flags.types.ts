import type { FeatureFlagName } from './feature-flags.constants';

export interface FeatureFlagDefinition {
  name: FeatureFlagName;
  envVar: string;
  fallback: boolean;
  legacyConfigKeys?: string[];
}
