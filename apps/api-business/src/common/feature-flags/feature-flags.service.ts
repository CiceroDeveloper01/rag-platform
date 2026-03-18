import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MetricsService } from '../../infra/observability/metrics.service';
import { FEATURE_FLAGS, type FeatureFlagName } from './feature-flags.constants';
import type { FeatureFlagDefinition } from './feature-flags.types';

@Injectable()
export class FeatureFlagsService {
  private readonly definitions: Record<FeatureFlagName, FeatureFlagDefinition> =
    {
      [FEATURE_FLAGS.RAG]: {
        name: FEATURE_FLAGS.RAG,
        envVar: 'FEATURE_RAG_ENABLED',
        fallback: true,
      },
      [FEATURE_FLAGS.TELEGRAM]: {
        name: FEATURE_FLAGS.TELEGRAM,
        envVar: 'FEATURE_TELEGRAM_ENABLED',
        fallback: true,
        legacyConfigKeys: ['omnichannel.telegram.enabled'],
      },
      [FEATURE_FLAGS.EMAIL]: {
        name: FEATURE_FLAGS.EMAIL,
        envVar: 'FEATURE_EMAIL_ENABLED',
        fallback: true,
        legacyConfigKeys: ['omnichannel.email.enabled'],
      },
      [FEATURE_FLAGS.LIVE_ACTIVITY]: {
        name: FEATURE_FLAGS.LIVE_ACTIVITY,
        envVar: 'FEATURE_LIVE_ACTIVITY_ENABLED',
        fallback: true,
      },
      [FEATURE_FLAGS.AI_USAGE_POLICY]: {
        name: FEATURE_FLAGS.AI_USAGE_POLICY,
        envVar: 'FEATURE_AI_USAGE_POLICY_ENABLED',
        fallback: true,
      },
      [FEATURE_FLAGS.RETRIEVAL_CACHE]: {
        name: FEATURE_FLAGS.RETRIEVAL_CACHE,
        envVar: 'FEATURE_RETRIEVAL_CACHE_ENABLED',
        fallback: true,
      },
      [FEATURE_FLAGS.DASHBOARD]: {
        name: FEATURE_FLAGS.DASHBOARD,
        envVar: 'FEATURE_DASHBOARD_ENABLED',
        fallback: true,
      },
    };

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FeatureFlagsService.name);
  }

  isEnabled(flagName: FeatureFlagName): boolean {
    const definition = this.definitions[flagName];
    const enabled = this.resolveDefinition(definition);

    this.metricsService.incrementCustomCounter(
      'feature_flag_checks_total',
      { flag: flagName, enabled: String(enabled) },
      1,
      'Total number of feature flag evaluations',
    );

    return enabled;
  }

  isRagEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.RAG);
  }

  isTelegramEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.TELEGRAM);
  }

  isEmailEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.EMAIL);
  }

  isLiveActivityEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.LIVE_ACTIVITY);
  }

  isAiUsagePolicyEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.AI_USAGE_POLICY);
  }

  isRetrievalCacheEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.RETRIEVAL_CACHE);
  }

  isDashboardEnabled(): boolean {
    return this.isEnabled(FEATURE_FLAGS.DASHBOARD);
  }

  recordDisabledHit(
    flagName: FeatureFlagName,
    context?: Record<string, unknown>,
  ): void {
    this.metricsService.incrementCustomCounter(
      'feature_flag_disabled_hits_total',
      { flag: flagName },
      1,
      'Total number of runtime operations blocked by disabled feature flags',
    );

    this.logger.warn(
      {
        flag: flagName,
        ...context,
      },
      'Feature flag prevented runtime execution',
    );
  }

  private resolveDefinition(definition: FeatureFlagDefinition): boolean {
    const directValue = this.configService.get<string | boolean | undefined>(
      definition.envVar,
    );
    const parsedDirectValue = this.parseBoolean(directValue);

    if (parsedDirectValue !== undefined) {
      return parsedDirectValue;
    }

    for (const legacyKey of definition.legacyConfigKeys ?? []) {
      const legacyValue = this.configService.get<string | boolean | undefined>(
        legacyKey,
      );
      const parsedLegacyValue = this.parseBoolean(legacyValue);

      if (parsedLegacyValue !== undefined) {
        return parsedLegacyValue;
      }
    }

    return definition.fallback;
  }

  private parseBoolean(
    value: string | boolean | undefined,
  ): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    return undefined;
  }
}
