import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { CONVERSATIONS_REPOSITORY } from '../interfaces/conversations-repository.interface';
import type { ConversationsRepositoryInterface } from '../interfaces/conversations-repository.interface';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject(CONVERSATIONS_REPOSITORY)
    private readonly conversationsRepository: ConversationsRepositoryInterface,
    private readonly metricsService: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConversationsService.name);
  }

  async listForUser(userId: number, limit = 20, offset = 0) {
    const conversations = await this.conversationsRepository.listByUser({
      userId,
      limit,
      offset,
    });
    this.metricsService.recordConversationOperation('list', 'success');
    return conversations;
  }

  async getConversation(conversationId: number, userId: number) {
    const conversation = await this.conversationsRepository.findById(
      conversationId,
      userId,
    );

    if (!conversation) {
      this.metricsService.recordConversationOperation('get', 'error');
      throw new NotFoundException('Conversation not found');
    }

    this.metricsService.recordConversationOperation('get', 'success');
    return conversation;
  }

  async createConversation(userId: number, title?: string) {
    const conversation = await this.conversationsRepository.create({
      userId,
      title: title?.trim() || 'New conversation',
    });
    this.metricsService.recordConversationOperation('create', 'success');
    return conversation;
  }

  async appendMessage(
    conversationId: number,
    userId: number,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ) {
    const conversation = await this.conversationsRepository.findById(
      conversationId,
      userId,
    );

    if (!conversation) {
      this.metricsService.recordConversationOperation('append', 'error');
      throw new ForbiddenException('Conversation is not accessible');
    }

    const message = await this.conversationsRepository.appendMessage({
      conversationId,
      role,
      content,
    });
    this.metricsService.recordConversationOperation('append', 'success');
    return message;
  }

  async deleteConversation(conversationId: number, userId: number) {
    await this.getConversation(conversationId, userId);
    await this.conversationsRepository.delete(conversationId, userId);
    this.metricsService.recordConversationOperation('delete', 'success');
    this.logger.info(
      { conversationId, userId },
      'Conversation deleted successfully',
    );
    return { success: true };
  }
}
