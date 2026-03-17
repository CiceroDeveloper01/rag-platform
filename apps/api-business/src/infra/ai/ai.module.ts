import { Global, Module } from '@nestjs/common';
import { EMBEDDING_SERVICE } from './embeddings/embedding.interface';
import { OpenAIEmbeddingService } from './embeddings/embedding.service';
import { LLM_SERVICE } from './llm/llm.interface';
import { OpenAILlmService } from './llm/llm.service';

@Global()
@Module({
  providers: [
    OpenAIEmbeddingService,
    OpenAILlmService,
    {
      provide: EMBEDDING_SERVICE,
      useExisting: OpenAIEmbeddingService,
    },
    {
      provide: LLM_SERVICE,
      useExisting: OpenAILlmService,
    },
  ],
  exports: [
    EMBEDDING_SERVICE,
    LLM_SERVICE,
    OpenAIEmbeddingService,
    OpenAILlmService,
  ],
})
export class AiModule {}
