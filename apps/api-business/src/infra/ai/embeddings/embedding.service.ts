import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';
import { EmbeddingServiceInterface } from './embedding.interface';

@Injectable()
export class OpenAIEmbeddingService implements EmbeddingServiceInterface {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpenAIEmbeddingService.name);
    this.model = this.configService.get<string>(
      'ai.embeddingModel',
      'text-embedding-3-small',
    );

    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.generateEmbeddings([text]);
    return embedding;
  }

  async generateEmbeddings(
    texts: string[],
    options?: {
      batchSize?: number;
    },
  ): Promise<number[][]> {
    if (!this.client) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }

    const embeddings: number[][] = [];
    const batchSize = options?.batchSize ?? 32;

    for (let index = 0; index < texts.length; index += batchSize) {
      const batch = texts.slice(index, index + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });

      const batchEmbeddings = response.data.map((item) => item.embedding);

      if (batchEmbeddings.some((embedding) => !embedding)) {
        this.logger.error(
          { batchSize: batch.length },
          'Embedding response returned empty vectors',
        );
        throw new ServiceUnavailableException('Embedding generation failed');
      }

      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }
}
