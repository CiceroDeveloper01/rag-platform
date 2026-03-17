export interface LlmCompletionOptions {
  stream?: boolean;
  maxOutputTokens?: number;
}

export interface LlmServiceInterface {
  generateCompletion(
    prompt: string,
    options?: LlmCompletionOptions,
  ): Promise<string>;
  streamCompletion(
    prompt: string,
    options?: LlmCompletionOptions,
  ): AsyncIterable<string>;
}

export const LLM_SERVICE = Symbol('LLM_SERVICE');
