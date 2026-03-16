import { OmnichannelDashboardPostgresQueryRepository } from './omnichannel-dashboard-postgres.query-repository';

describe('OmnichannelDashboardPostgresQueryRepository', () => {
  it('builds overview data from aggregated SQL queries', async () => {
    const databaseService = {
      query: jest
        .fn()
        .mockResolvedValueOnce([
          {
            total_requests: 10,
            success_count: 8,
            error_count: 2,
            avg_latency_ms: 100,
            p95_latency_ms: 180,
            rag_usage_percentage: 60,
            active_connectors: 2,
            requests_last_24h: 4,
            requests_last_7d: 9,
          },
        ])
        .mockResolvedValueOnce([
          {
            channel: 'TELEGRAM',
            total_requests: 6,
            success_count: 5,
            error_count: 1,
          },
        ]),
    };

    const repository = new OmnichannelDashboardPostgresQueryRepository(
      databaseService as never,
    );
    const result = await repository.getOverview({}, 'tenant-a');

    expect(result).toEqual(
      expect.objectContaining({
        totalRequests: 10,
        channels: [
          expect.objectContaining({
            channel: 'TELEGRAM',
          }),
        ],
      }),
    );
    expect(databaseService.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $3",
      ),
      [null, null, 'tenant-a'],
    );
  });

  it('returns paginated request rows with total count', async () => {
    const databaseService = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([
          {
            id: 1,
            channel: 'EMAIL',
            conversation_id: 'conv-1',
            sender_name: 'Sender',
            sender_address: 'sender@example.com',
            normalized_text_preview: 'preview',
            status: 'PROCESSED',
            received_at: new Date('2026-03-13T10:00:00.000Z'),
            processed_at: new Date('2026-03-13T10:00:01.000Z'),
            latency_ms: 90,
            used_rag: true,
          },
        ]),
    };

    const repository = new OmnichannelDashboardPostgresQueryRepository(
      databaseService as never,
    );
    const result = await repository.listRequests(
      { limit: 20, offset: 0 },
      'tenant-a',
    );

    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 1,
        usedRag: true,
      }),
    );
    expect(databaseService.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "COALESCE(m.metadata ->> 'tenantId', 'default-tenant') = $8",
      ),
      [null, null, null, null, null, null, null, 'tenant-a'],
    );
  });
});
