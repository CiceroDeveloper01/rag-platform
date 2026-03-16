import { Test } from '@nestjs/testing';
import {
  IExecutionTrackingRepository,
  OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY,
} from '../interfaces/execution-tracking-repository.interface';
import { ExecutionActivityStreamService } from './execution-activity-stream.service';
import { ExecutionService } from './execution.service';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { ExecutionEventName } from '../../domain/enums/execution-event-name.enum';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';

describe('ExecutionService', () => {
  const repository: jest.Mocked<IExecutionTrackingRepository> = {
    createExecution: jest.fn(),
    logEvent: jest.fn(),
    completeExecution: jest.fn(),
    failExecution: jest.fn(),
  };
  const executionActivityStreamService = {
    publish: jest.fn(),
    stream: jest.fn(),
  };

  let service: ExecutionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExecutionService,
        {
          provide: OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY,
          useValue: repository,
        },
        {
          provide: ExecutionActivityStreamService,
          useValue: executionActivityStreamService,
        },
      ],
    }).compile();

    service = moduleRef.get(ExecutionService);
  });

  it('delegates execution creation to the repository', async () => {
    repository.createExecution.mockResolvedValue({
      id: 1,
      sourceType: 'omnichannel_request',
      sourceId: 10,
      channel: MessageChannel.EMAIL,
      correlationId: 'corr-1',
      traceId: 'trace-1',
      status: OmnichannelExecutionStatus.STARTED,
      errorMessage: null,
      startedAt: new Date('2026-03-13T10:00:00.000Z'),
      finishedAt: null,
      createdAt: new Date('2026-03-13T10:00:00.000Z'),
      updatedAt: new Date('2026-03-13T10:00:00.000Z'),
    });

    const result = await service.createExecution({
      sourceType: 'omnichannel_request',
      sourceId: 10,
      channel: MessageChannel.EMAIL,
      correlationId: 'corr-1',
      traceId: 'trace-1',
    });

    expect(result.id).toBe(1);
    expect(repository.createExecution).toHaveBeenCalled();
    expect(executionActivityStreamService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: 1,
        type: 'execution_started',
        eventType: 'execution_started',
        color: 'blue',
        icon: 'play',
        severity: 'info',
        message: 'Execution started',
      }),
    );
  });

  it('delegates event logging to the repository', async () => {
    repository.logEvent.mockResolvedValue({
      id: 100,
      executionId: 1,
      eventName: ExecutionEventName.MESSAGE_RECEIVED,
      metadata: null,
      occurredAt: new Date('2026-03-13T10:00:00.000Z'),
      createdAt: new Date('2026-03-13T10:00:00.000Z'),
    });

    await service.logEvent({
      executionId: 1,
      eventName: ExecutionEventName.MESSAGE_RECEIVED,
    });

    expect(repository.logEvent).toHaveBeenCalledWith({
      executionId: 1,
      eventName: ExecutionEventName.MESSAGE_RECEIVED,
    });
    expect(executionActivityStreamService.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: 1,
        type: ExecutionEventName.MESSAGE_RECEIVED,
        eventType: ExecutionEventName.MESSAGE_RECEIVED,
        color: 'green',
        icon: 'message-circle',
        severity: 'success',
        message: 'Message received',
      }),
    );
  });
});
