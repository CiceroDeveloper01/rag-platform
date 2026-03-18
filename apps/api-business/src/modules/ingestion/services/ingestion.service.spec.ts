import { ConflictException, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { DocumentIngestionPublisherService } from '../../../common/messaging/document-ingestion.publisher';
import { FileValidationService } from '../../../common/validation/file-validation.service';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { IngestionService } from './ingestion.service';

describe('IngestionService replay', () => {
  function createService(sourceRepository: {
    findById?: jest.Mock;
    update?: jest.Mock;
  }) {
    return new IngestionService(
      {
        validateDocumentUpload: jest.fn(),
        sanitizeFilename: jest.fn((value: string) => value),
        sanitizeMetadata: jest.fn((value?: Record<string, string>) => value ?? {}),
      } as unknown as FileValidationService,
      sourceRepository as never,
      {
        upload: jest.fn(),
        delete: jest.fn(),
        download: jest.fn().mockResolvedValue(Buffer.from('hello')),
      } as never,
      {
        invalidateByPrefix: jest.fn(),
      } as unknown as AppCacheService,
      {
        recordIngestion: jest.fn(),
        incrementCustomCounter: jest.fn(),
      } as unknown as MetricsService,
      {
        publish: jest.fn().mockResolvedValue(undefined),
      } as unknown as DocumentIngestionPublisherService,
      {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as PinoLogger,
    );
  }

  it('republishes a failed source for replay', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const findById = jest.fn().mockResolvedValue({
      id: 7,
      tenantId: 'tenant-acme',
      filename: 'manual.pdf',
      type: 'application/pdf',
      sourceChannel: 'web',
      ingestionStatus: 'FAILED',
      storageKey: 'docs/manual.pdf',
      storageUrl: 'file:///docs/manual.pdf',
      uploadedAt: new Date('2026-03-17T12:00:00.000Z'),
    });
    const update = jest.fn().mockResolvedValue(undefined);
    const service = new IngestionService(
      {
        validateDocumentUpload: jest.fn(),
        sanitizeFilename: jest.fn((value: string) => value),
        sanitizeMetadata: jest.fn((value?: Record<string, string>) => value ?? {}),
      } as unknown as FileValidationService,
      { findById, update } as never,
      {
        upload: jest.fn(),
        delete: jest.fn(),
        download: jest.fn().mockResolvedValue(Buffer.from('hello')),
      } as never,
      {
        invalidateByPrefix: jest.fn(),
      } as unknown as AppCacheService,
      {
        recordIngestion: jest.fn(),
        incrementCustomCounter: jest.fn(),
      } as unknown as MetricsService,
      {
        publish,
      } as unknown as DocumentIngestionPublisherService,
      {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as PinoLogger,
    );

    const response = await service.replayFailedIngestion(7);

    expect(update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        ingestionStatus: 'PENDING',
      }),
    );
    expect(response).toEqual(
      expect.objectContaining({
        documentId: 7,
        status: 'PENDING',
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 7,
        tenantId: 'tenant-acme',
        sourceChannel: 'web',
        filename: 'manual.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/manual.pdf',
        storageUrl: 'file:///docs/manual.pdf',
        fileContentBase64: Buffer.from('hello').toString('base64'),
        eventId: expect.any(String),
        correlationId: expect.any(String),
      }),
    );
  });

  it('rejects replay for sources that are not in FAILED status', async () => {
    const service = createService({
      findById: jest.fn().mockResolvedValue({
        id: 7,
        ingestionStatus: 'COMPLETED',
      }),
      update: jest.fn(),
    });

    await expect(service.replayFailedIngestion(7)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects replay for missing sources', async () => {
    const service = createService({
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    });

    await expect(service.replayFailedIngestion(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
