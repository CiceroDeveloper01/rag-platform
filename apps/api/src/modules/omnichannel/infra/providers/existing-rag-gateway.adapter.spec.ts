import { Test } from '@nestjs/testing';
import { SearchService } from '../../../search/services/search.service';
import { ExistingRagGatewayAdapter } from './existing-rag-gateway.adapter';

describe('ExistingRagGatewayAdapter', () => {
  it('maps the existing semantic search service into the omnichannel contract', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExistingRagGatewayAdapter,
        {
          provide: SearchService,
          useValue: {
            search: jest.fn().mockResolvedValue({
              results: [
                {
                  id: 1,
                  content:
                    'pgvector allows vector similarity search in PostgreSQL.',
                  metadata: {},
                  distance: 0.12,
                },
              ],
            }),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(ExistingRagGatewayAdapter);
    const result = await service.query({
      question: 'What is pgvector?',
      topK: 5,
    });

    expect(result.question).toBe('What is pgvector?');
    expect(result.contexts).toHaveLength(1);
  });
});
