import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';
import { LlmCompletionOptions, LlmServiceInterface } from './llm.interface';

@Injectable()
export class OpenAILlmService implements LlmServiceInterface {
  private readonly client: OpenAI | null;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpenAILlmService.name);
    this.model = this.configService.get<string>('ai.llmModel', 'gpt-4o-mini');

    const apiKey = this.configService.get<string>('ai.openaiApiKey');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generateCompletion(
    prompt: string,
    options?: LlmCompletionOptions,
  ): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }

    if (options?.stream) {
      this.logger.warn(
        'Streaming was requested but the synchronous completion path was used',
      );
    }

    const response = await this.client.responses.create({
      model: this.model,
      input: prompt,
      max_output_tokens: options?.maxOutputTokens,
    });

    const output = response.output_text?.trim();

    if (!output) {
      this.logger.error('LLM response returned empty output_text');
      throw new ServiceUnavailableException('LLM completion failed');
    }

    return output;
  }

  async *streamCompletion(
    prompt: string,
    options?: LlmCompletionOptions,
  ): AsyncIterable<string> {
    if (!this.client) {
      throw new ServiceUnavailableException('OPENAI_API_KEY is not configured');
    }

    const stream = await this.client.responses.create({
      model: this.model,
      input: prompt,
      max_output_tokens: options?.maxOutputTokens,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        yield event.delta;
      }
    }
  }
}
