import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReplaySubject, Observable } from 'rxjs';
import { createClient, type RedisClientType } from 'redis';

export interface AnalyticsStreamEvent {
  eventType:
    | 'message_received'
    | 'agent_selected'
    | 'flow_executed'
    | 'agent_quality'
    | 'user_feedback'
    | 'ai_cost'
    | 'tenant_usage';
  timestamp: string;
  channel?: string;
  language?: string;
  agent?: string;
  flow?: string;
  tenantId?: string;
  model?: string;
  keywords?: string[];
  averageQualityScore?: number;
  failureRate?: number;
  userSatisfaction?: number;
  averageRating?: number;
  totalCost?: number;
  tokensInput?: number;
  tokensOutput?: number;
  costByAgent?: Array<{
    agentName: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
  costByTenant?: Array<{
    tenantId: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

export interface LanguageAggregate {
  language: string;
  label: string;
  count: number;
}

export interface LanguageTimelinePoint {
  date: string;
  count: number;
}

export interface LanguageTimelineSeries {
  language: string;
  label: string;
  points: LanguageTimelinePoint[];
}

interface IncomingAnalyticsEvent {
  eventType: string;
  timestamp: string;
  channel?: string;
  language?: string;
  agent?: string;
  flow?: string;
  tenantId?: string;
  model?: string;
  keywords?: string[];
  averageQualityScore?: number;
  failureRate?: number;
  userSatisfaction?: number;
  averageRating?: number;
  totalCost?: number;
  tokensInput?: number;
  tokensOutput?: number;
  costByAgent?: Array<{
    agentName: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
  costByTenant?: Array<{
    tenantId: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

export interface AnalyticsCostSnapshot {
  totalCost: number;
  costByAgent: Array<{
    agentName: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

export interface TenantUsageSnapshot {
  costByTenant: Array<{
    tenantId: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private readonly streamSubject = new ReplaySubject<AnalyticsStreamEvent>(100);
  private readonly languageCounts = new Map<string, number>();
  private readonly languageTimeline = new Map<string, Map<string, number>>();
  private readonly tenantLanguageCounts = new Map<
    string,
    Map<string, number>
  >();
  private readonly tenantLanguageTimeline = new Map<
    string,
    Map<string, Map<string, number>>
  >();
  private latestAgentQuality = {
    averageQualityScore: 0,
    failureRate: 0,
  };
  private readonly tenantAgentQuality = new Map<
    string,
    {
      averageQualityScore: number;
      failureRate: number;
    }
  >();
  private latestUserFeedback = {
    userSatisfaction: 0,
    averageRating: 0,
  };
  private readonly tenantUserFeedback = new Map<
    string,
    {
      userSatisfaction: number;
      averageRating: number;
    }
  >();
  private latestAiCost: AnalyticsCostSnapshot = {
    totalCost: 0,
    costByAgent: [] as Array<{
      agentName: string;
      cost: number;
      tokensInput: number;
      tokensOutput: number;
    }>,
  };
  private readonly tenantAiCost = new Map<string, AnalyticsCostSnapshot>();
  private latestTenantUsage: TenantUsageSnapshot = {
    costByTenant: [] as Array<{
      tenantId: string;
      cost: number;
      tokensInput: number;
      tokensOutput: number;
    }>,
  };
  private readonly tenantUsage = new Map<string, TenantUsageSnapshot>();
  private subscriber?: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  stream(): Observable<AnalyticsStreamEvent> {
    return this.streamSubject.asObservable();
  }

  getAgentQuality(tenantId?: string) {
    return tenantId
      ? (this.tenantAgentQuality.get(tenantId) ??
          this.createEmptyAgentQuality())
      : this.latestAgentQuality;
  }

  getUserFeedback(tenantId?: string) {
    return tenantId
      ? (this.tenantUserFeedback.get(tenantId) ??
          this.createEmptyUserFeedback())
      : this.latestUserFeedback;
  }

  getAiCost(tenantId?: string) {
    return tenantId
      ? (this.tenantAiCost.get(tenantId) ?? this.createEmptyAiCost())
      : this.latestAiCost;
  }

  getTenantUsage(tenantId?: string) {
    return tenantId
      ? (this.tenantUsage.get(tenantId) ?? this.createEmptyTenantUsage())
      : this.latestTenantUsage;
  }

  getLanguages(tenantId?: string) {
    const languages = this.buildLanguageAggregates(tenantId);

    return {
      languages,
      total: languages.reduce((sum, entry) => sum + entry.count, 0),
    };
  }

  getLanguageTimeline(tenantId?: string) {
    const timeline = tenantId
      ? (this.tenantLanguageTimeline.get(tenantId) ??
        new Map<string, Map<string, number>>())
      : this.languageTimeline;
    const series = Array.from(timeline.entries())
      .map(([language, points]) => ({
        language,
        label: this.getLanguageLabel(language),
        points: Array.from(points.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((left, right) => left.date.localeCompare(right.date)),
      }))
      .sort((left, right) => {
        const leftTotal = left.points.reduce(
          (sum, point) => sum + point.count,
          0,
        );
        const rightTotal = right.points.reduce(
          (sum, point) => sum + point.count,
          0,
        );

        return rightTotal - leftTotal;
      });

    return { series };
  }

  async onModuleInit(): Promise<void> {
    const redisEnabled =
      this.configService.get<boolean>('cache.redis.enabled', false) ?? false;

    if (!redisEnabled) {
      return;
    }

    const redisHost = this.configService.get<string>(
      'cache.redis.host',
      'localhost',
    );
    const redisPort =
      this.configService.get<number>('cache.redis.port', 6379) ?? 6379;
    const redisPassword =
      this.configService.get<string>('cache.redis.password') || undefined;
    const redisDb = this.configService.get<number>('cache.redis.db', 0) ?? 0;

    this.subscriber = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword,
      database: redisDb,
    });

    await this.subscriber.connect();
    await this.subscriber.subscribe('analytics-events', (message) => {
      this.handleIncomingEvent(message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber?.isOpen) {
      await this.subscriber.quit();
    }
  }

  private handleIncomingEvent(message: string): void {
    try {
      const parsed = JSON.parse(message) as IncomingAnalyticsEvent;
      const normalized = this.normalizeEvent(parsed);

      if (normalized) {
        this.streamSubject.next(normalized);
      }
    } catch {
      // Ignore malformed analytics events so the stream remains resilient.
    }
  }

  private normalizeEvent(
    event: IncomingAnalyticsEvent,
  ): AnalyticsStreamEvent | null {
    switch (event.eventType) {
      case 'analytics.message.received':
        if (event.language) {
          this.languageCounts.set(
            event.language,
            (this.languageCounts.get(event.language) ?? 0) + 1,
          );
          this.incrementLanguageTimeline(event.language, event.timestamp);
          this.incrementTenantLanguageCounters(
            event.tenantId,
            event.language,
            event.timestamp,
          );
        }

        return {
          eventType: 'message_received',
          timestamp: event.timestamp,
          channel: event.channel,
          language: event.language,
          tenantId: event.tenantId,
          keywords: event.keywords ?? [],
        };
      case 'analytics.agent.selected':
        if (event.tenantId) {
          this.tenantAgentQuality.set(
            event.tenantId,
            this.tenantAgentQuality.get(event.tenantId) ??
              this.createEmptyAgentQuality(),
          );
        }
        return {
          eventType: 'agent_selected',
          timestamp: event.timestamp,
          channel: event.channel,
          language: event.language,
          agent: event.agent,
          tenantId: event.tenantId,
          keywords: event.keywords ?? [],
        };
      case 'analytics.flow.executed':
        return {
          eventType: 'flow_executed',
          timestamp: event.timestamp,
          channel: event.channel,
          language: event.language,
          agent: event.agent,
          flow: event.flow,
          tenantId: event.tenantId,
          keywords: event.keywords ?? [],
        };
      case 'analytics.agent.quality': {
        this.latestAgentQuality = {
          averageQualityScore: event.averageQualityScore ?? 0,
          failureRate: event.failureRate ?? 0,
        };
        if (event.tenantId) {
          this.tenantAgentQuality.set(event.tenantId, {
            averageQualityScore: event.averageQualityScore ?? 0,
            failureRate: event.failureRate ?? 0,
          });
        }

        return {
          eventType: 'agent_quality',
          timestamp: event.timestamp,
          channel: event.channel,
          agent: event.agent,
          tenantId: event.tenantId,
          averageQualityScore: event.averageQualityScore ?? 0,
          failureRate: event.failureRate ?? 0,
        };
      }
      case 'analytics.user.feedback': {
        this.latestUserFeedback = {
          userSatisfaction: event.userSatisfaction ?? 0,
          averageRating: event.averageRating ?? 0,
        };
        if (event.tenantId) {
          this.tenantUserFeedback.set(event.tenantId, {
            userSatisfaction: event.userSatisfaction ?? 0,
            averageRating: event.averageRating ?? 0,
          });
        }

        return {
          eventType: 'user_feedback',
          timestamp: event.timestamp,
          tenantId: event.tenantId,
          userSatisfaction: event.userSatisfaction ?? 0,
          averageRating: event.averageRating ?? 0,
        };
      }
      case 'analytics.ai.cost': {
        this.latestAiCost = {
          totalCost: event.totalCost ?? 0,
          costByAgent: event.costByAgent ?? [],
        };
        if (event.tenantId) {
          this.tenantAiCost.set(event.tenantId, {
            totalCost: event.totalCost ?? 0,
            costByAgent: event.costByAgent ?? [],
          });
        }

        return {
          eventType: 'ai_cost',
          timestamp: event.timestamp,
          tenantId: event.tenantId,
          agent: event.agent,
          model: event.model,
          totalCost: event.totalCost ?? 0,
          tokensInput: event.tokensInput ?? 0,
          tokensOutput: event.tokensOutput ?? 0,
          costByAgent: event.costByAgent ?? [],
          costByTenant: event.costByTenant ?? [],
        };
      }
      case 'analytics.tenant.usage': {
        this.latestTenantUsage = {
          costByTenant: event.costByTenant ?? [],
        };
        if (event.tenantId) {
          this.tenantUsage.set(event.tenantId, {
            costByTenant: (event.costByTenant ?? []).filter(
              (entry) => entry.tenantId === event.tenantId,
            ),
          });
        }

        return {
          eventType: 'tenant_usage',
          timestamp: event.timestamp,
          tenantId: event.tenantId,
          costByTenant: event.costByTenant ?? [],
        };
      }
      default:
        return null;
    }
  }

  private buildLanguageAggregates(tenantId?: string): LanguageAggregate[] {
    const source = tenantId
      ? (this.tenantLanguageCounts.get(tenantId) ?? new Map<string, number>())
      : this.languageCounts;

    return Array.from(source.entries())
      .map(([language, count]) => ({
        language,
        label: this.getLanguageLabel(language),
        count,
      }))
      .sort((left, right) => right.count - left.count);
  }

  private incrementLanguageTimeline(language: string, timestamp: string): void {
    const day = timestamp.slice(0, 10);
    const points =
      this.languageTimeline.get(language) ?? new Map<string, number>();

    points.set(day, (points.get(day) ?? 0) + 1);
    this.languageTimeline.set(language, points);
  }

  private incrementTenantLanguageCounters(
    tenantId: string | undefined,
    language: string,
    timestamp: string,
  ): void {
    if (!tenantId) {
      return;
    }

    const tenantCounts =
      this.tenantLanguageCounts.get(tenantId) ?? new Map<string, number>();
    tenantCounts.set(language, (tenantCounts.get(language) ?? 0) + 1);
    this.tenantLanguageCounts.set(tenantId, tenantCounts);

    const tenantTimeline =
      this.tenantLanguageTimeline.get(tenantId) ??
      new Map<string, Map<string, number>>();
    const languagePoints =
      tenantTimeline.get(language) ?? new Map<string, number>();
    const day = timestamp.slice(0, 10);

    languagePoints.set(day, (languagePoints.get(day) ?? 0) + 1);
    tenantTimeline.set(language, languagePoints);
    this.tenantLanguageTimeline.set(tenantId, tenantTimeline);
  }

  private createEmptyAgentQuality() {
    return {
      averageQualityScore: 0,
      failureRate: 0,
    };
  }

  private createEmptyUserFeedback() {
    return {
      userSatisfaction: 0,
      averageRating: 0,
    };
  }

  private createEmptyAiCost(): AnalyticsCostSnapshot {
    return {
      totalCost: 0,
      costByAgent: [],
    };
  }

  private createEmptyTenantUsage(): TenantUsageSnapshot {
    return {
      costByTenant: [],
    };
  }

  private getLanguageLabel(language: string): string {
    switch (language) {
      case 'en':
        return 'English';
      case 'pt':
        return 'Português';
      case 'es':
        return 'Español';
      default:
        return language.toUpperCase();
    }
  }
}
