import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import { DOCUMENTS_REPOSITORY } from '../interfaces/documents-repository.interface';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const documentsRepository = {
    create: jest.fn(),
    createMany: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const embeddingService = {
    generateEmbedding: jest.fn(),
  };

  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };
  const appCacheService = {
    invalidateByPrefix: jest.fn().mockResolvedValue(1),
  };

  let service: DocumentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: DOCUMENTS_REPOSITORY,
          useValue: documentsRepository,
        },
        {
          provide: EMBEDDING_SERVICE,
          useValue: embeddingService,
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
        {
          provide: AppCacheService,
          useValue: appCacheService,
        },
      ],
    }).compile();

    service = moduleRef.get(DocumentsService);
  });

  it('creates a document with generated embedding', async () => {
    embeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    documentsRepository.create.mockResolvedValue({
      id: 12,
      tenantId: 'tenant-a',
      sourceId: null,
      content: 'PostgreSQL and pgvector',
      metadata: { category: 'database' },
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
    });

    const document = await service.createDocument({
      tenantId: 'tenant-a',
      content: 'PostgreSQL and pgvector',
      metadata: { category: 'database' },
    });

    expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
      'PostgreSQL and pgvector',
    );
    expect(documentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a',
        content: 'PostgreSQL and pgvector',
        embedding: [0.1, 0.2, 0.3],
      }),
    );
    expect(document.id).toBe(12);
  });

  it('throws not found when requested document does not exist', async () => {
    documentsRepository.findById.mockResolvedValue(null);

    await expect(service.getDocument(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('wraps unexpected persistence failures', async () => {
    embeddingService.generateEmbedding.mockRejectedValue(
      new Error('embedding unavailable'),
    );

    await expect(
      service.createDocument({
        tenantId: 'tenant-a',
        content: 'Failure case',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
