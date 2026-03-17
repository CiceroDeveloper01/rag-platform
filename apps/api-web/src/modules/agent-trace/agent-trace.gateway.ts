import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Subscription } from 'rxjs';
import { AgentTraceService } from './agent-trace.service';
import type { AgentTraceEvent } from './agent-trace.repository';

@WebSocketGateway({
  path: '/ws/agent-trace',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AgentTraceGateway implements OnGatewayInit {
  @WebSocketServer()
  private server: {
    clients?: Set<{ readyState?: number; send: (payload: string) => void }>;
  };

  private subscription?: Subscription;

  constructor(private readonly agentTraceService: AgentTraceService) {}

  afterInit(): void {
    this.subscription = this.agentTraceService.stream().subscribe((event) => {
      this.broadcast(event);
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private broadcast(event: AgentTraceEvent): void {
    for (const client of this.server.clients ?? []) {
      if (client.readyState === 1) {
        client.send(JSON.stringify(event));
      }
    }
  }
}
