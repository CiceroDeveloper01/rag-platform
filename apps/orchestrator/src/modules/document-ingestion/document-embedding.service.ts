import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

@Injectable()
export class DocumentEmbeddingService {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    this.model = this.configService.get<string>(
      "OPENAI_EMBEDDING_MODEL",
      "text-embedding-3-small",
    );
  }

  async generateEmbeddings(
    texts: string[],
    options?: { batchSize?: number },
  ): Promise<number[][]> {
    if (!this.client) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not configured");
    }

    const embeddings: number[][] = [];
    const batchSize = options?.batchSize ?? 32;

    for (let index = 0; index < texts.length; index += batchSize) {
      const batch = texts.slice(index, index + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });
      embeddings.push(...response.data.map((item) => item.embedding));
    }

    return embeddings;
  }
}
