import { Test } from '@nestjs/testing';
import { LLM_SERVICE } from '../../../../infra/ai/llm/llm.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { DefaultAgentExecutor } from './default-agent-executor.service';

describe('DefaultAgentExecutor', () => {
  it('uses the llm provider when available', async () => {
    const generateCompletion = jest
      .fn()
      .mockResolvedValue('Resposta gerada pelo modelo');
    const moduleRef = await Test.createTestingModule({
      providers: [
        DefaultAgentExecutor,
        {
          provide: LLM_SERVICE,
          useValue: {
            generateCompletion,
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(DefaultAgentExecutor);
    const result = await service.execute({
      message: OmnichannelMessage.createInbound({
        channel: MessageChannel.EMAIL,
        body: 'Explique a politica de privacidade',
        normalizedText: 'Explique a politica de privacidade',
      }),
      channel: MessageChannel.EMAIL,
      correlationId: 'corr-1',
      traceId: 'trace-1',
      agentName: 'rag-agent',
      ragResult: null,
    });

    expect(result.responseText).toBe('Resposta gerada pelo modelo');
    expect(result.usedRag).toBe(false);
    expect(generateCompletion).toHaveBeenCalledWith(expect.any(String), {
      maxOutputTokens: undefined,
    });
  });

  it('falls back to deterministic output when llm fails', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DefaultAgentExecutor,
        {
          provide: LLM_SERVICE,
          useValue: {
            generateCompletion: jest
              .fn()
              .mockRejectedValue(new Error('llm unavailable')),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(DefaultAgentExecutor);
    const result = await service.execute({
      message: OmnichannelMessage.createInbound({
        channel: MessageChannel.TEAMS,
        body: 'Quero consultar a knowledge base',
        normalizedText: 'Quero consultar a knowledge base',
      }),
      channel: MessageChannel.TEAMS,
      correlationId: 'corr-1',
      traceId: 'trace-1',
      agentName: 'rag-agent',
      ragResult: {
        question: 'Quero consultar a knowledge base',
        contexts: [
          {
            id: 1,
            content: 'Knowledge base entry',
            metadata: null,
            distance: 0.1,
          },
        ],
      },
    });

    expect(result.modelName).toBe('deterministic-fallback');
    expect(result.usedRag).toBe(true);
  });
});
