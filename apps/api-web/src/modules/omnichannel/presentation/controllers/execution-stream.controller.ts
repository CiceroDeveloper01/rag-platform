import { Controller, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { map, Observable } from 'rxjs';
import { RequiredScopes } from '../../../../common/decorators/required-scopes.decorator';
import { SessionAuthGuard } from '../../../auth/guards/session-auth.guard';
import { ScopesGuard } from '../../../auth/guards/scopes.guard';
import { ExecutionActivityStreamService } from '../../application/services/execution-activity-stream.service';

@ApiTags('Omnichannel', 'Dashboard')
@ApiCookieAuth('rag_platform_session')
@Controller('api/v1')
@UseGuards(SessionAuthGuard, ScopesGuard)
export class ExecutionStreamController {
  constructor(
    private readonly executionActivityStreamService: ExecutionActivityStreamService,
  ) {}

  @Sse('executions/stream')
  @RequiredScopes('omnichannel:read')
  @ApiProduces('text/event-stream')
  @ApiOperation({
    summary:
      'Streams omnichannel execution activity events in real time for the dashboard.',
  })
  @ApiOkResponse({
    description: 'SSE stream with execution lifecycle events.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  stream(): Observable<MessageEvent> {
    return this.executionActivityStreamService.stream().pipe(
      map((event) => ({
        type: 'execution',
        data: event,
      })),
    );
  }
}
