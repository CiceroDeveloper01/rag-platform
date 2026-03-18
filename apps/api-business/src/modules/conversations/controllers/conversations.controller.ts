import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { AddConversationMessageRequest } from '../dtos/request/add-message.request';
import { ConversationsQueryRequest } from '../dtos/request/conversations-query.request';
import { CreateConversationRequest } from '../dtos/request/create-conversation.request';
import { ConversationsService } from '../services/conversations.service';

@ApiTags('Conversations')
@ApiCookieAuth('rag_platform_session')
@Controller(['conversations', 'api/v1/conversations'])
@UseGuards(SessionAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Returns paginated conversations for the authenticated user.',
  })
  @ApiOkResponse({ description: 'Conversation list returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ConversationsQueryRequest,
  ) {
    return this.conversationsService.listForUser(
      user.id,
      query.limit ?? 20,
      query.offset ?? 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Returns a single conversation and its messages.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ description: 'Conversation returned successfully.' })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.conversationsService.getConversation(conversationId, user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Creates a new conversation for the authenticated user.',
  })
  @ApiBody({ type: CreateConversationRequest })
  @ApiOkResponse({ description: 'Conversation created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid conversation payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationRequest,
  ) {
    return this.conversationsService.createConversation(user.id, dto.title);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Appends a message to an existing conversation.' })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiBody({ type: AddConversationMessageRequest })
  @ApiOkResponse({ description: 'Conversation message appended successfully.' })
  @ApiBadRequestResponse({
    description: 'Invalid conversation message payload.',
  })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  appendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: AddConversationMessageRequest,
  ) {
    return this.conversationsService.appendMessage(
      conversationId,
      user.id,
      dto.role,
      dto.content,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deletes a conversation for the authenticated user.',
  })
  @ApiParam({ name: 'id', type: Number, example: 12 })
  @ApiOkResponse({ description: 'Conversation deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    return this.conversationsService.deleteConversation(
      conversationId,
      user.id,
    );
  }
}
