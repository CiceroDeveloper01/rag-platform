import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";

@Injectable()
export class OrchestratorHealthService {
  constructor(private readonly configService: ConfigService) {}

  async live() {
    return {
      status: "ok",
      service: this.configService.get<string>(
        "app.name",
        "rag-platform-orchestrator",
      ),
      version: this.configService.get<string>("app.version", "0.0.1"),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const [redis, internalApi] = await Promise.all([
      this.checkRedis(),
      this.checkInternalApi(),
    ]);
    const ready = redis.status === "up" && internalApi.status === "up";

    return {
      status: ready ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        redis,
        internalApi,
      },
    };
  }

  async health() {
    const [live, ready] = await Promise.all([this.live(), this.ready()]);

    return {
      ...live,
      readiness: ready,
    };
  }

  private async checkRedis() {
    const client = createClient({
      socket: {
        host: this.configService.get<string>("queue.redis.host", "localhost"),
        port: this.configService.get<number>("queue.redis.port", 6379) ?? 6379,
        connectTimeout: 2_000,
      },
      database: this.configService.get<number>("queue.redis.db", 0) ?? 0,
      password:
        this.configService.get<string>("queue.redis.password") || undefined,
    });

    try {
      await client.connect();
      const pong = await client.ping();

      return {
        status: pong === "PONG" ? "up" : "degraded",
      };
    } catch (error) {
      return {
        status: "down",
        reason: error instanceof Error ? error.message : "redis_unavailable",
      };
    } finally {
      await client.disconnect().catch(() => undefined);
    }
  }

  private async checkInternalApi() {
    const baseUrl =
      this.configService.get<string>("internalApi.baseUrl") ??
      "http://localhost:3000";
    const url = new URL("/api/v1/health", baseUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      return {
        status: response.ok ? "up" : "down",
        statusCode: response.status,
      };
    } catch (error) {
      return {
        status: "down",
        reason:
          error instanceof Error ? error.message : "internal_api_unavailable",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
