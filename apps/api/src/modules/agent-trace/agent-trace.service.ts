import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, ReplaySubject } from 'rxjs';
import { createClient, type RedisClientType } from 'redis';
import {
  AgentTraceEvent,
  AgentTraceRepository,
} from './agent-trace.repository';
import type { IncomingAgentTraceEvent } from './interfaces';

@Injectable()
export class AgentTraceService implements OnModuleInit, OnModuleDestroy {
  private readonly streamSubject = new ReplaySubject<AgentTraceEvent>(200);
  private subscriber?: RedisClientType;

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: AgentTraceRepository,
  ) {}

  stream(): Observable<AgentTraceEvent> {
    return this.streamSubject.asObservable();
  }

  history(): AgentTraceEvent[] {
    return this.repository.list();
  }

  async onModuleInit(): Promise<void> {
    const redisEnabled =
      this.configService.get<boolean>('cache.redis.enabled', false) ?? false;

    if (!redisEnabled) {
      return;
    }

    const redisHost = this.configService.get<string>(
      'cache.redis.host',
      'localhost',
    );
    const redisPort =
      this.configService.get<number>('cache.redis.port', 6379) ?? 6379;
    const redisPassword =
      this.configService.get<string>('cache.redis.password') || undefined;
    const redisDb = this.configService.get<number>('cache.redis.db', 0) ?? 0;

    this.subscriber = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword,
      database: redisDb,
    });

    await this.subscriber.connect();
    await this.subscriber.subscribe('agent-trace-events', (message) => {
      this.handleIncomingEvent(message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber?.isOpen) {
      await this.subscriber.quit();
    }
  }

  private handleIncomingEvent(message: string): void {
    try {
      const parsed = JSON.parse(message) as IncomingAgentTraceEvent;
      const normalized: AgentTraceEvent = {
        traceId: parsed.traceId,
        timestamp: parsed.timestamp,
        step: parsed.step,
        data: parsed.data ?? {},
      };

      const saved = this.repository.save(normalized);
      this.streamSubject.next(saved);
    } catch {
      // Ignore malformed frames to keep the live stream resilient.
    }
  }
}
