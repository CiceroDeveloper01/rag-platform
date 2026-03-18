import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RagUsagePolicyService } from './rag-usage-policy.service';

describe('RagUsagePolicyService', () => {
  let service: RagUsagePolicyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RagUsagePolicyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              const values: Record<string, unknown> = {
                'omnichannel.alwaysUseRag': false,
                'omnichannel.ragKeywords': ['manual', 'knowledge base'],
              };

              return values[key] ?? fallback;
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(RagUsagePolicyService);
  });

  it('enables RAG when configured keywords are present', () => {
    const decision = service.evaluate('Preciso consultar o manual do produto');

    expect(decision.useRag).toBe(true);
    expect(decision.matchedKeywords).toContain('manual');
  });

  it('keeps direct response when no keyword matches', () => {
    const decision = service.evaluate('Bom dia, tudo bem?');

    expect(decision.useRag).toBe(false);
    expect(decision.reason).toBe('direct_response');
  });
});
