import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppModule } from '../src/app.module';
import { SessionAuthGuard } from '../src/modules/auth/guards/session-auth.guard';
import { ListRequestsQuery } from '../src/modules/omnichannel/application/queries/list-requests.query';
import { OmnichannelOrchestratorService } from '../src/modules/omnichannel/application/services/omnichannel-orchestrator.service';
import { OmnichannelConnectorService } from '../src/modules/omnichannel/application/services/omnichannel-connector.service';
import { OmnichannelQueryService } from '../src/modules/omnichannel/application/services/omnichannel-query.service';
import { OmnichannelController } from '../src/modules/omnichannel/presentation/controllers/omnichannel.controller';
import { OmnichannelDashboardController } from '../src/modules/omnichannel/presentation/controllers/omnichannel-dashboard.controller';
import { MessageChannel } from '../src/modules/omnichannel/domain/enums/message-channel.enum';

describe('Omnichannel module integration', () => {
  let moduleRef: TestingModule;
  let commandController: OmnichannelController;
  let dashboardController: OmnichannelDashboardController;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideProvider(OmnichannelOrchestratorService)
      .useValue({
        process: jest.fn().mockResolvedValue({
          correlationId: 'corr-1',
          traceId: 'trace-1',
          messageId: 1,
          outboundMessageId: 2,
          executionId: 3,
          usedRag: true,
          responseText: 'Resposta omnichannel',
          dispatchAccepted: false,
        }),
      })
      .overrideProvider(OmnichannelQueryService)
      .useValue({
        getOverview: jest.fn().mockResolvedValue({
          totalRequests: 10,
          successCount: 7,
          errorCount: 1,
          avgLatencyMs: 120,
          p95LatencyMs: 240,
          ragUsagePercentage: 40,
          activeConnectors: 1,
          requestsLast24h: 4,
          requestsLast7d: 9,
          channels: [],
        }),
        getRequestById: jest.fn().mockResolvedValue({
          message: {
            id: 1,
            channel: MessageChannel.EMAIL,
            direction: 'INBOUND',
            conversationId: 'conv-1',
            senderName: 'Sender',
            senderAddress: 'sender@example.com',
            recipientAddress: 'support@example.com',
            subject: 'Hello',
            body: 'Mensagem',
            normalizedText: 'Mensagem',
            metadata: {},
            status: 'PROCESSED',
            receivedAt: new Date('2026-03-13T12:00:00.000Z'),
            processedAt: new Date('2026-03-13T12:00:01.000Z'),
          },
          execution: null,
        }),
        listRequests: jest.fn().mockResolvedValue({
          items: [],
          pagination: { total: 0, limit: 20, offset: 0 },
        }),
        listExecutions: jest.fn().mockResolvedValue({
          items: [],
          pagination: { total: 0, limit: 20, offset: 0 },
        }),
        getExecutionById: jest.fn().mockResolvedValue(null),
        listConnectors: jest.fn().mockResolvedValue([]),
        listChannelMetrics: jest.fn().mockResolvedValue([]),
        getLatencyMetrics: jest.fn().mockResolvedValue([]),
        getRagUsageMetrics: jest.fn().mockResolvedValue({
          totalExecutions: 0,
          ragExecutions: 0,
          ragUsagePercentage: 0,
          channels: [],
        }),
      })
      .overrideProvider(OmnichannelConnectorService)
      .useValue({
        toggle: jest.fn().mockResolvedValue({
          id: 1,
          channel: MessageChannel.TELEGRAM,
          name: 'telegram-default',
          isEnabled: false,
          healthStatus: 'HEALTHY',
          lastHealthCheckAt: null,
        }),
      })
      .compile();

    commandController = moduleRef.get(OmnichannelController);
    dashboardController = moduleRef.get(OmnichannelDashboardController);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('maps POST /api/v1/omnichannel/dev/process to the orchestrator', async () => {
    await expect(
      commandController.process({
        channel: MessageChannel.EMAIL,
        body: 'Preciso do manual',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        executionId: 3,
        usedRag: true,
      }),
    );
  });

  it('maps GET /api/v1/omnichannel/overview to the query service', async () => {
    await expect(dashboardController.overview({})).resolves.toEqual(
      expect.objectContaining({
        totalRequests: 10,
      }),
    );
  });

  it('maps GET /api/v1/omnichannel/requests/:id to the query service', async () => {
    await expect(dashboardController.getRequest(1)).resolves.toEqual(
      expect.objectContaining({
        message: expect.objectContaining({
          id: 1,
        }),
      }),
    );
  });

  it('maps GET /api/v1/omnichannel/requests to the paginated query service', async () => {
    await expect(
      dashboardController.listRequests({
        limit: 20,
        offset: 0,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: [],
        pagination: expect.objectContaining({
          total: 0,
        }),
      }),
    );
  });

  it('maps GET /api/v1/omnichannel/metrics/rag-usage to the metrics query service', async () => {
    await expect(dashboardController.getRagUsageMetrics({})).resolves.toEqual(
      expect.objectContaining({
        totalExecutions: 0,
        ragExecutions: 0,
      }),
    );
  });

  it('rejects invalid list request query params with the same validation rules used by the endpoint', async () => {
    const query = plainToInstance(ListRequestsQuery, {
      channel: 'NOT_A_CHANNEL',
    });

    await expect(validate(query)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'channel',
          constraints: expect.objectContaining({
            isEnum: expect.any(String),
          }),
        }),
      ]),
    );
  });
});
