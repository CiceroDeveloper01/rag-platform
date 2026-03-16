import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  function createService() {
    return new AnalyticsService({
      get: jest.fn(),
    } as never);
  }

  it('tracks language and cost aggregates per tenant', () => {
    const service = createService();

    (
      service as unknown as {
        normalizeEvent: (event: Record<string, unknown>) => unknown;
      }
    ).normalizeEvent({
      eventType: 'analytics.message.received',
      timestamp: '2026-03-15T10:00:00.000Z',
      tenantId: 'tenant-a',
      channel: 'EMAIL',
      language: 'en',
    });
    (
      service as unknown as {
        normalizeEvent: (event: Record<string, unknown>) => unknown;
      }
    ).normalizeEvent({
      eventType: 'analytics.ai.cost',
      timestamp: '2026-03-15T10:01:00.000Z',
      tenantId: 'tenant-a',
      totalCost: 12.5,
      costByAgent: [
        {
          agentName: 'conversation-agent',
          cost: 12.5,
          tokensInput: 100,
          tokensOutput: 80,
        },
      ],
      costByTenant: [
        {
          tenantId: 'tenant-a',
          cost: 12.5,
          tokensInput: 100,
          tokensOutput: 80,
        },
      ],
    });

    expect(service.getLanguages('tenant-a')).toEqual({
      languages: [
        {
          language: 'en',
          label: 'English',
          count: 1,
        },
      ],
      total: 1,
    });
    expect(service.getAiCost('tenant-a')).toEqual({
      totalCost: 12.5,
      costByAgent: [
        expect.objectContaining({
          agentName: 'conversation-agent',
          cost: 12.5,
        }),
      ],
    });
  });

  it('returns empty snapshots for tenants without events', () => {
    const service = createService();

    expect(service.getAgentQuality('tenant-missing')).toEqual({
      averageQualityScore: 0,
      failureRate: 0,
    });
    expect(service.getTenantUsage('tenant-missing')).toEqual({
      costByTenant: [],
    });
  });
});
