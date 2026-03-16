import { Injectable } from "@nestjs/common";
import {
  AppLoggerService,
  MetricsService,
  TracingService,
} from "@rag-platform/observability";
import { Channel } from "@rag-platform/contracts";

interface ChannelRequestOptions {
  channel: Channel;
  operation: string;
  method: "GET" | "POST";
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs: number;
  retryEnabled?: boolean;
  retryMaxAttempts?: number;
  retryInitialDelayMs?: number;
  retryMaxDelayMs?: number;
  idempotent?: boolean;
}

@Injectable()
export class ChannelHttpClient {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly tracingService: TracingService,
  ) {}

  async requestJson<TResponse>(
    options: ChannelRequestOptions,
  ): Promise<TResponse> {
    const span = this.tracingService.startSpan(
      `channels.${options.channel}.${options.operation}`,
    );
    const startedAt = Date.now();
    const maxAttempts = this.resolveMaxAttempts(options);
    let attempt = 0;
    let lastError: unknown;

    try {
      while (attempt < maxAttempts) {
        attempt += 1;

        try {
          const result = await this.executeRequest<TResponse>(options);
          this.metricsService.increment("channel_http_requests_total");
          this.metricsService.record(
            "channel_http_request_duration_ms",
            Date.now() - startedAt,
          );
          return result;
        } catch (error) {
          lastError = error;

          if (!this.shouldRetry(options, error, attempt, maxAttempts)) {
            this.logger.error(
              "Channel request failed",
              error instanceof Error ? error.stack : undefined,
              ChannelHttpClient.name,
              {
                channel: options.channel,
                operation: options.operation,
                method: options.method,
                url: options.url,
                attempts: attempt,
                reason: this.describeError(error),
              },
            );
            this.metricsService.increment(
              "channel_http_request_failures_total",
            );
            throw error;
          }

          const delayMs = this.computeDelay(options, attempt);
          this.logger.warn("Channel retry attempt", ChannelHttpClient.name, {
            channel: options.channel,
            operation: options.operation,
            method: options.method,
            attempt,
            maxAttempts,
            delayMs,
            reason: this.describeError(error),
          });
          this.metricsService.increment("channel_http_retry_attempts_total");
          await wait(delayMs);
        }
      }

      this.metricsService.increment("channel_http_request_failures_total");
      throw lastError instanceof Error
        ? lastError
        : new Error("Channel request failed");
    } finally {
      this.tracingService.endSpan(span);
    }
  }

  private async executeRequest<TResponse>(
    options: ChannelRequestOptions,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(options.url, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `status=${response.status}; body=${body || "empty_response"}`,
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as TResponse;
      }

      return (await response.text()) as TResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`request timed out after ${options.timeoutMs}ms`);
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveMaxAttempts(options: ChannelRequestOptions): number {
    if (!options.retryEnabled || !options.idempotent) {
      return 1;
    }

    return Math.max(1, options.retryMaxAttempts ?? 3);
  }

  private shouldRetry(
    options: ChannelRequestOptions,
    error: unknown,
    attempt: number,
    maxAttempts: number,
  ): boolean {
    if (
      !options.retryEnabled ||
      !options.idempotent ||
      attempt >= maxAttempts
    ) {
      return false;
    }

    if (!(error instanceof Error)) {
      return false;
    }

    return /status=408|status=429|status=502|status=503|status=504|timed out|fetch failed|network|ECONNREFUSED|ECONNRESET|EAI_AGAIN/i.test(
      error.message,
    );
  }

  private computeDelay(
    options: ChannelRequestOptions,
    attempt: number,
  ): number {
    const initialDelayMs = options.retryInitialDelayMs ?? 250;
    const maxDelayMs = options.retryMaxDelayMs ?? 2_000;
    const exponentialDelay = Math.min(
      maxDelayMs,
      initialDelayMs * 2 ** Math.max(0, attempt - 1),
    );
    const jitter = Math.round(exponentialDelay * 0.2 * Math.random());

    return Math.min(maxDelayMs, exponentialDelay + jitter);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "unknown_error";
  }
}

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
