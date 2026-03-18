import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { ChatRequest } from '../dtos/request/chat.request';
import { ChatResponse } from '../dtos/response/chat.response';
import { ChatResponseMapper } from '../mappers/chat-response.mapper';
import { ChatService } from '../services/chat.service';

@ApiTags('Chat', 'RAG')
@ApiCookieAuth('rag_platform_session')
@Controller(['chat', 'api/v1/chat'])
@UseGuards(SessionAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly tenantContextService: TenantContextService,
    private readonly chatResponseMapper: ChatResponseMapper,
  ) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Runs the end-to-end RAG chat pipeline and optionally streams tokens using SSE.',
  })
  @ApiConsumes('application/json')
  @ApiBody({ type: ChatRequest })
  @ApiOkResponse({
    description:
      'Returns a chat response as JSON or streams events when the client requests text/event-stream.',
    type: ChatResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid chat payload.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async chat(
    @Body() dto: ChatRequest,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
    @Res() response: Response,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    const tenantId = this.tenantContextService.resolveTenant({
      headerTenantId: tenantIdHeader,
      explicitTenantId: dto.tenantId,
    });
    const wantsStreaming =
      dto.stream === true ||
      request.headers.accept?.includes('text/event-stream') === true;
    const scopedDto = {
      ...dto,
      tenantId,
    };

    if (!wantsStreaming) {
      return response.json(
        this.chatResponseMapper.toResponse(
          await this.chatService.chat(scopedDto, user),
        ),
      );
    }

    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders?.();

    for await (const event of this.chatService.streamChat(scopedDto, user)) {
      response.write(`event: ${event.event}\n`);
      response.write(`data: ${JSON.stringify(event.data)}\n\n`);
    }

    response.end();
  }
}
