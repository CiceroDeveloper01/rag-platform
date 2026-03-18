import { PinoLogger } from 'nestjs-pino';
import { InternalIngestionService } from './internal-ingestion.service';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { IngestionService } from '../../ingestion/services/ingestion.service';

describe('InternalIngestionService', () => {
  const createService = (sourceRepository: {
    findById?: jest.Mock;
    update?: jest.Mock;
  }) =>
    new InternalIngestionService(
      {
        createMany: jest.fn(),
      } as never,
      sourceRepository as never,
      {
        invalidateByPrefix: jest.fn(),
      } as unknown as AppCacheService,
      {
        requestBufferedIngestion: jest.fn(),
      } as unknown as IngestionService,
      {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as unknown as PinoLogger,
    );

  it('starts processing and increments the persisted attempt count', async () => {
    const findById = jest.fn().mockResolvedValue({
      id: 42,
      ingestionStatus: 'PENDING',
      ingestionAttemptCount: 1,
    });
    const update = jest.fn().mockResolvedValue(undefined);
    const service = createService({ findById, update });

    const response = await service.start({
      sourceId: 42,
      eventId: 'evt-1',
      correlationId: 'corr-1',
      retryCount: 1,
    });

    expect(update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        ingestionStatus: 'PROCESSING',
        ingestionCurrentStep: 'RECEIVED',
        ingestionAttemptCount: 2,
        lastIngestionEventId: 'evt-1',
        lastIngestionCorrelationId: 'corr-1',
      }),
    );
    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        shouldProcess: true,
        attemptCount: 2,
      }),
    );
  });

  it('skips completed sources for idempotency', async () => {
    const findById = jest.fn().mockResolvedValue({
      id: 42,
      ingestionStatus: 'COMPLETED',
      ingestionAttemptCount: 2,
    });
    const update = jest.fn();
    const service = createService({ findById, update });

    const response = await service.start({
      sourceId: 42,
      eventId: 'evt-1',
      correlationId: 'corr-1',
      retryCount: 0,
    });

    expect(update).not.toHaveBeenCalled();
    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        shouldProcess: false,
        reason: 'already_completed',
      }),
    );
  });

  it('skips duplicate deliveries for the same event while already processing', async () => {
    const findById = jest.fn().mockResolvedValue({
      id: 42,
      ingestionStatus: 'PROCESSING',
      ingestionAttemptCount: 2,
      lastIngestionEventId: 'evt-1',
    });
    const update = jest.fn();
    const service = createService({ findById, update });

    const response = await service.start({
      sourceId: 42,
      eventId: 'evt-1',
      correlationId: 'corr-1',
      retryCount: 1,
    });

    expect(update).not.toHaveBeenCalled();
    expect(response).toEqual(
      expect.objectContaining({
        success: true,
        shouldProcess: false,
        reason: 'already_processing_same_event',
      }),
    );
  });
});
