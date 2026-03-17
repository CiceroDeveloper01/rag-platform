import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { RAG_CONTEXT_TTL } from '../../../common/cache/constants/cache-ttl.constants';
import { CacheKeyHelper } from '../../../common/cache/helpers/cache-key.helper';
import { AppCacheService } from '../../../common/cache/services/app-cache.service';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { SearchResult } from '../../search/interfaces/search-result.interface';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { LLM_SERVICE } from '../../../infra/ai/llm/llm.interface';
import type { LlmServiceInterface } from '../../../infra/ai/llm/llm.interface';
import { SearchService } from '../../search/services/search.service';
import { EMBEDDING_SERVICE } from '../../../infra/ai/embeddings/embedding.interface';
import type { EmbeddingServiceInterface } from '../../../infra/ai/embeddings/embedding.interface';
import { ChatRequest } from '../dtos/request/chat.request';
import { CONVERSATIONS_REPOSITORY } from '../../conversations/interfaces/conversations-repository.interface';
import type { ConversationsRepositoryInterface } from '../../conversations/interfaces/conversations-repository.interface';
import { QUERY_REPOSITORY } from '../interfaces/query-repository.interface';
import type { QueryRepositoryInterface } from '../interfaces/query-repository.interface';
import { DOCUMENTS_REPOSITORY } from '../../documents/interfaces/documents-repository.interface';
import type { DocumentsRepositoryInterface } from '../../documents/interfaces/documents-repository.interface';

@Injectable()
export class ChatService {
  private static readonly CHAT_ROUTE = '/chat';
  private static readonly DEFAULT_MAX_CONTEXT_CHARACTERS = 6000;
  private static readonly MAX_CONTEXT_CHUNKS = 8;
  private readonly llmTimeoutMs: number;

  constructor(
    private readonly searchService: SearchService,
    @Inject(EMBEDDING_SERVICE)
    private readonly embeddingService: EmbeddingServiceInterface,
    @Inject(LLM_SERVICE)
    private readonly llmService: LlmServiceInterface,
    @Inject(QUERY_REPOSITORY)
    private readonly queryRepository: QueryRepositoryInterface,
    @Inject(CONVERSATIONS_REPOSITORY)
    private readonly conversationsRepository: ConversationsRepositoryInterface,
    @Inject(DOCUMENTS_REPOSITORY)
    private readonly documentsRepository: DocumentsRepositoryInterface,
    private readonly appCacheService: AppCacheService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatService.name);
    this.llmTimeoutMs = this.configService.get<number>(
      'ai.llmTimeoutMs',
      30_000,
    );
  }

  async chat(dto: ChatRequest, user: AuthenticatedUser) {
    try {
      const conversation = await this.ensureConversation(dto, user);
      await this.conversationsRepository.appendMessage({
        conversationId: conversation.id,
        role: 'user',
        content: dto.question,
      });
      const pipeline = await this.runPipeline(dto);
      const answer =
        pipeline.context.length === 0
          ? this.buildNoContextAnswer(dto.question)
          : await this.generateAnswer(dto, pipeline.context);
      const assistantMessage = await this.conversationsRepository.appendMessage(
        {
          conversationId: conversation.id,
          role: 'assistant',
          content: answer,
        },
      );
      const query = await this.queryRepository.create({
        question: dto.question,
        answer,
        userId: user.id,
        conversationId: conversation.id,
      });

      this.metricsService.recordRagRequest(ChatService.CHAT_ROUTE, 'success');
      this.logger.info(
        {
          queryId: query.id,
          contextDocuments: pipeline.context.length,
          retrievalMode: pipeline.mode,
        },
        'RAG pipeline completed successfully',
      );

      return {
        queryId: query.id,
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        answer,
        context: pipeline.context,
      };
    } catch (error) {
      this.metricsService.recordRagRequest(ChatService.CHAT_ROUTE, 'error');
      this.logger.error({ err: error }, 'RAG pipeline execution failed');
      throw new ServiceUnavailableException('RAG pipeline is unavailable');
    }
  }

  async *streamChat(
    dto: ChatRequest,
    user: AuthenticatedUser,
  ): AsyncGenerator<{
    event: 'context' | 'token' | 'done' | 'error';
    data: unknown;
  }> {
    let answer = '';

    try {
      const conversation = await this.ensureConversation(dto, user);
      await this.conversationsRepository.appendMessage({
        conversationId: conversation.id,
        role: 'user',
        content: dto.question,
      });
      const pipeline = await this.runPipeline(dto);
      yield {
        event: 'context',
        data: {
          question: dto.question,
          conversationId: conversation.id,
          context: pipeline.context,
        },
      };

      if (pipeline.context.length === 0) {
        answer = this.buildNoContextAnswer(dto.question);
        yield {
          event: 'token',
          data: {
            delta: answer,
          },
        };
      } else {
        for await (const token of this.generateStreamingAnswer(
          dto,
          pipeline.context,
        )) {
          answer += token;
          yield {
            event: 'token',
            data: {
              delta: token,
            },
          };
        }
      }

      const assistantMessage = await this.conversationsRepository.appendMessage(
        {
          conversationId: conversation.id,
          role: 'assistant',
          content: answer,
        },
      );

      const query = await this.queryRepository.create({
        question: dto.question,
        answer,
        userId: user.id,
        conversationId: conversation.id,
      });

      this.metricsService.recordRagRequest(ChatService.CHAT_ROUTE, 'success');
      yield {
        event: 'done',
        data: {
          queryId: query.id,
          conversationId: conversation.id,
          messageId: assistantMessage.id,
          answer,
        },
      };
    } catch (error) {
      this.metricsService.recordRagRequest(ChatService.CHAT_ROUTE, 'error');
      this.logger.error(
        { err: error },
        'Streaming RAG pipeline execution failed',
      );
      yield {
        event: 'error',
        data: {
          message: 'RAG pipeline is unavailable',
        },
      };
    }
  }

  private async measureStage<T>(
    stage: 'embedding' | 'vector_search' | 'llm',
    operation: () => Promise<T>,
  ): Promise<T> {
    const startedAt = process.hrtime.bigint();

    try {
      const result = await operation();
      this.recordStageMetric(stage, 'success', startedAt);
      return result;
    } catch (error) {
      this.recordStageMetric(stage, 'error', startedAt);
      throw error;
    }
  }

  private recordStageMetric(
    stage: 'embedding' | 'vector_search' | 'llm',
    status: 'success' | 'error',
    startedAt: bigint,
  ): void {
    const durationInSeconds =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;

    if (stage === 'embedding') {
      this.metricsService.observeRagEmbeddingDuration(
        ChatService.CHAT_ROUTE,
        status,
        durationInSeconds,
      );
      return;
    }

    if (stage === 'vector_search') {
      this.metricsService.observeRagVectorSearchDuration(
        ChatService.CHAT_ROUTE,
        status,
        durationInSeconds,
      );
      return;
    }

    this.metricsService.observeRagLlmDuration(
      ChatService.CHAT_ROUTE,
      status,
      durationInSeconds,
    );
  }

  private async runPipeline(dto: ChatRequest): Promise<{
    prompt: string;
    context: SearchResult[];
    mode: 'semantic' | 'keyword_fallback';
  }> {
    try {
      return await this.appCacheService.wrap(
        CacheKeyHelper.build('rag:context', {
          tenantId: dto.tenantId ?? 'default-tenant',
          question: dto.question,
          topK: dto.topK ?? 5,
          maxContextCharacters:
            dto.maxContextCharacters ??
            ChatService.DEFAULT_MAX_CONTEXT_CHARACTERS,
        }),
        async () => {
          const embedding = await this.measureStage('embedding', () =>
            this.embeddingService.generateEmbedding(dto.question),
          );
          const retrievedDocuments = await this.measureStage(
            'vector_search',
            () =>
              this.searchService.searchByEmbedding(
                embedding,
                dto.topK ?? 5,
                dto.tenantId ?? 'default-tenant',
              ),
          );
          const context = this.selectContextDocuments(
            retrievedDocuments,
            dto.maxContextCharacters ??
              ChatService.DEFAULT_MAX_CONTEXT_CHARACTERS,
          );

          return {
            prompt: this.buildPrompt(dto.question, context),
            context,
            mode: 'semantic' as const,
          };
        },
        { ttl: RAG_CONTEXT_TTL },
      );
    } catch (error) {
      if (!this.isLocalRagFallbackCandidate(error)) {
        throw error;
      }

      const context = await this.buildKeywordFallbackContext(dto);
      this.logger.warn(
        {
          question: dto.question,
          contextDocuments: context.length,
        },
        'Semantic retrieval unavailable, using keyword fallback context',
      );

      return {
        prompt: this.buildPrompt(dto.question, context),
        context,
        mode: 'keyword_fallback',
      };
    }
  }

  private async generateAnswer(
    dto: ChatRequest,
    context: SearchResult[],
  ): Promise<string> {
    try {
      return await this.measureStage('llm', () =>
        this.withTimeout(
          this.llmService.generateCompletion(
            this.buildPrompt(dto.question, context),
            {
              stream: dto.stream,
            },
          ),
          this.llmTimeoutMs,
          'LLM completion timed out',
        ),
      );
    } catch (error) {
      if (!this.isLocalRagFallbackCandidate(error)) {
        throw error;
      }

      this.logger.warn(
        { err: error },
        'LLM unavailable, returning retrieval-only fallback answer',
      );
      return this.buildRetrievalOnlyAnswer(dto.question, context);
    }
  }

  private async *generateStreamingAnswer(
    dto: ChatRequest,
    context: SearchResult[],
  ): AsyncGenerator<string> {
    const llmStartedAt = process.hrtime.bigint();

    try {
      for await (const token of this.withStreamTimeout(
        this.llmService.streamCompletion(
          this.buildPrompt(dto.question, context),
        ),
        this.llmTimeoutMs,
      )) {
        yield token;
      }

      this.recordStageMetric('llm', 'success', llmStartedAt);
    } catch (error) {
      this.recordStageMetric('llm', 'error', llmStartedAt);

      if (!this.isLocalRagFallbackCandidate(error)) {
        throw error;
      }

      const fallbackAnswer = this.buildRetrievalOnlyAnswer(
        dto.question,
        context,
      );
      for (const chunk of this.chunkTextForStreaming(fallbackAnswer)) {
        yield chunk;
      }
    }
  }

  private isLocalRagFallbackCandidate(error: unknown): boolean {
    if (error instanceof ServiceUnavailableException) {
      return true;
    }

    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.message.includes('OPENAI_API_KEY') ||
      error.message.includes('LLM completion failed') ||
      error.message.includes('Embedding generation failed')
    );
  }

  private async buildKeywordFallbackContext(
    dto: ChatRequest,
  ): Promise<SearchResult[]> {
    const terms = this.extractKeywordFallbackTerms(dto.question);
    const maxContextCharacters =
      dto.maxContextCharacters ?? ChatService.DEFAULT_MAX_CONTEXT_CHARACTERS;
    const limit = Math.min(dto.topK ?? 5, ChatService.MAX_CONTEXT_CHUNKS);
    const documentsById = new Map<number, SearchResult>();

    for (const term of terms) {
      const matches = await this.documentsRepository.list({
        tenantId: dto.tenantId ?? 'default-tenant',
        query: term,
        limit,
        offset: 0,
        order: 'desc',
      });

      for (const document of matches) {
        if (documentsById.has(document.id)) {
          continue;
        }

        documentsById.set(document.id, {
          id: document.id,
          content: document.content,
          metadata: document.metadata ?? null,
          distance: 1,
        });

        if (documentsById.size >= limit) {
          break;
        }
      }

      if (documentsById.size >= limit) {
        break;
      }
    }

    return this.selectContextDocuments(
      [...documentsById.values()],
      maxContextCharacters,
    );
  }

  private extractKeywordFallbackTerms(question: string): string[] {
    const normalizedQuestion = question
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    const stopWords = new Set([
      'sobre',
      'para',
      'com',
      'como',
      'esse',
      'essa',
      'isso',
      'qual',
      'quais',
      'onde',
      'quando',
      'algum',
      'alguma',
      'documento',
      'fala',
      'falar',
      'does',
      'have',
      'that',
      'this',
      'what',
      'which',
      'about',
    ]);

    const terms = normalizedQuestion
      .split(/[^a-z0-9]+/i)
      .map((term) => term.trim())
      .filter((term) => term.length >= 4 && !stopWords.has(term));

    return [...new Set([normalizedQuestion, ...terms])].slice(0, 6);
  }

  private buildRetrievalOnlyAnswer(
    question: string,
    context: SearchResult[],
  ): string {
    if (context.length === 0) {
      return this.buildNoContextAnswer(question);
    }

    const excerpts = context
      .slice(0, 3)
      .map((document, index) => {
        const excerpt =
          document.content.length > 220
            ? `${document.content.slice(0, 220).trim()}...`
            : document.content;
        return `${index + 1}. ${excerpt}`;
      })
      .join('\n');

    return [
      `Nao consegui usar o modelo de linguagem para sintetizar uma resposta completa sobre "${question}".`,
      'Mesmo assim, recuperei estes trechos relevantes dos documentos:',
      excerpts,
      'Configure OPENAI_API_KEY para habilitar respostas RAG completas com sintese do modelo.',
    ].join('\n\n');
  }

  private buildNoContextAnswer(question: string): string {
    return [
      `Nao encontrei contexto relevante nos documentos ingeridos para responder a pergunta "${question}".`,
      'Tente reformular a pergunta com termos que existam nos documentos ou envie arquivos relacionados ao assunto antes de consultar o chat.',
    ].join(' ');
  }

  private chunkTextForStreaming(text: string): string[] {
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return [];
    }

    return trimmedText.match(/.{1,80}(\s|$)/g) ?? [trimmedText];
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    timeoutInMs: number,
    message: string,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(new Error(message));
          }, timeoutInMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async *withStreamTimeout(
    stream: AsyncIterable<string>,
    timeoutInMs: number,
  ): AsyncGenerator<string> {
    const iterator = stream[Symbol.asyncIterator]();

    while (true) {
      const nextChunk = await this.withTimeout(
        iterator.next(),
        timeoutInMs,
        'LLM stream timed out',
      );

      if (nextChunk.done) {
        break;
      }

      yield nextChunk.value;
    }
  }

  private async ensureConversation(dto: ChatRequest, user: AuthenticatedUser) {
    if (dto.conversationId) {
      const existingConversation = await this.conversationsRepository.findById(
        dto.conversationId,
        user.id,
      );

      if (existingConversation) {
        return existingConversation;
      }
    }

    return this.conversationsRepository.create({
      userId: user.id,
      title: this.buildConversationTitle(dto.question),
    });
  }

  private buildConversationTitle(question: string): string {
    return question.length > 60 ? `${question.slice(0, 60)}...` : question;
  }

  private selectContextDocuments(
    documents: SearchResult[],
    maxContextCharacters: number,
  ): SearchResult[] {
    const selectedDocuments: SearchResult[] = [];
    let currentCharacters = 0;

    for (const document of documents) {
      if (selectedDocuments.length >= ChatService.MAX_CONTEXT_CHUNKS) {
        break;
      }

      if (currentCharacters + document.content.length > maxContextCharacters) {
        break;
      }

      selectedDocuments.push(document);
      currentCharacters += document.content.length;
    }

    return selectedDocuments.length > 0
      ? selectedDocuments
      : documents.slice(0, 1);
  }

  private buildPrompt(question: string, documents: SearchResult[]): string {
    const context =
      documents.length > 0
        ? documents
            .map(
              (document, index) =>
                `Chunk ${String(index + 1)}:\n${document.content}`,
            )
            .join('\n\n')
        : 'No relevant context found.';

    return `Context:\n${context}\n\nQuestion:\n${question}\n\nInstructions:\nAnswer using only the context.\nIf the answer is not present in the context, say that you do not know.`;
  }
}
