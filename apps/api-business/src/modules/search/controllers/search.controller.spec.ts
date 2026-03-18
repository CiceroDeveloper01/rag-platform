import { SearchController } from './search.controller';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { SearchService } from '../services/search.service';
import { SearchResponseMapper } from '../mappers/search-response.mapper';

describe('SearchController', () => {
  it('returns semantic search results with source and createdAt fields', async () => {
    const searchService = {
      search: jest.fn().mockResolvedValue({
        results: [
          {
            id: 1,
            content: 'pgvector enables similarity search inside PostgreSQL.',
            metadata: { source: 'manual.pdf' },
            distance: 0.08,
            source: 'manual.pdf',
            createdAt: '2026-03-15T10:00:00.000Z',
          },
        ],
      }),
    } as unknown as SearchService;
    const tenantContextService: Pick<TenantContextService, 'resolveTenant'> = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    };

    const controller = new SearchController(
      searchService,
      tenantContextService,
      new SearchResponseMapper(),
    );

    const result = await controller.search(
      {
        query: 'What is pgvector?',
        top_k: 5,
      },
      'tenant-a',
    );

    expect(searchService.search).toHaveBeenCalledWith(
      {
        query: 'What is pgvector?',
        top_k: 5,
      },
      'tenant-a',
    );
    expect(result.results[0]).toEqual(
      expect.objectContaining({
        source: 'manual.pdf',
        createdAt: '2026-03-15T10:00:00.000Z',
      }),
    );
  });
});
