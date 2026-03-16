import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Subscription } from 'rxjs';
import {
  AnalyticsService,
} from './analytics.service';
import type { AnalyticsStreamEvent } from './interfaces';

@WebSocketGateway({
  path: '/ws/analytics',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AnalyticsGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server: {
    clients?: Set<{
      readyState?: number;
      send: (payload: string) => void;
      tenantId?: string;
    }>;
  };

  private subscription?: Subscription;

  constructor(private readonly analyticsService: AnalyticsService) {}

  afterInit(): void {
    this.subscription = this.analyticsService.stream().subscribe((event) => {
      this.broadcast(event);
    });
  }

  handleConnection(
    client: { tenantId?: string },
    request: { url?: string },
  ): void {
    const tenantId = this.resolveTenantFromUrl(request.url);
    client.tenantId = tenantId;
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private broadcast(event: AnalyticsStreamEvent): void {
    for (const client of this.server.clients ?? []) {
      if (
        client.readyState === 1 &&
        (client.tenantId ?? 'default-tenant') ===
          (event.tenantId ?? 'default-tenant')
      ) {
        client.send(JSON.stringify(event));
      }
    }
  }

  private resolveTenantFromUrl(url?: string): string {
    if (!url) {
      return 'default-tenant';
    }

    try {
      const parsed = new URL(url, 'http://localhost');
      return parsed.searchParams.get('tenantId')?.trim() || 'default-tenant';
    } catch {
      return 'default-tenant';
    }
  }
}
