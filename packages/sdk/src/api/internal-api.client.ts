import { InternalApiError } from "@rag-platform/shared";
import { ApiClient } from "../interfaces/api-client.interface";

export interface InternalApiClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  retryEnabled?: boolean;
  retryMaxAttempts?: number;
  retryInitialDelayMs?: number;
  retryMaxDelayMs?: number;
  circuitBreakerEnabled?: boolean;
  circuitBreakerFailureThreshold?: number;
  circuitBreakerOpenMs?: number;
  onRetryAttempt?: (context: {
    path: string;
    method: string;
    attempt: number;
    maxAttempts: number;
    delayMs: number;
    reason: string;
  }) => void;
  onFinalFailure?: (context: {
    path: string;
    method: string;
    attempts: number;
    reason: string;
  }) => void;
  onCircuitOpen?: (context: {
    path: string;
    method: string;
    failureCount: number;
    openForMs: number;
  }) => void;
  onCircuitClose?: (context: { path: string; method: string }) => void;
}

export class InternalApiClient implements ApiClient {
  private circuitBreakerState?: {
    failureCount: number;
    openUntil?: number;
  };

  constructor(private readonly options: InternalApiClientOptions) {}

  async post<TRequest, TResponse = unknown>(
    path: string,
    payload: TRequest,
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
    });
  }

  async get<TResponse = unknown>(path: string): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "GET",
    });
  }

  private async request<TResponse>(
    path: string,
    init: RequestInit,
  ): Promise<TResponse> {
    this.assertCircuitClosed(path, init.method);
    const maxAttempts = this.resolveMaxAttempts(init.method);
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      attempt += 1;

      try {
        const result = await this.executeRequest<TResponse>(path, init);
        this.onRequestSuccess(path, init.method);
        return result;
      } catch (error) {
        lastError = error;
        this.onRequestFailure(path, init.method, error);

        if (!this.shouldRetry(init.method, error, attempt, maxAttempts)) {
          this.options.onFinalFailure?.({
            path,
            method: normalizeMethod(init.method),
            attempts: attempt,
            reason: this.describeError(error),
          });
          throw error;
        }

        const delayMs = this.computeDelay(attempt);
        this.options.onRetryAttempt?.({
          path,
          method: normalizeMethod(init.method),
          attempt,
          maxAttempts,
          delayMs,
          reason: this.describeError(error),
        });
        await wait(delayMs);
      }
    }

    this.options.onFinalFailure?.({
      path,
      method: normalizeMethod(init.method),
      attempts: maxAttempts,
      reason: this.describeError(lastError),
    });
    throw lastError instanceof Error
      ? lastError
      : new Error("Internal API request failed");
  }

  private async executeRequest<TResponse>(
    path: string,
    init: RequestInit,
  ): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs ?? 10_000,
    );

    try {
      const response = await fetch(
        new URL(path, this.options.baseUrl).toString(),
        {
          ...init,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new InternalApiError(
          "Internal API request failed",
          response.status,
          {
            path,
            body,
          },
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as TResponse;
      }

      return (await response.text()) as TResponse;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(
          `Internal API request timed out after ${this.options.timeoutMs ?? 10_000}ms`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveMaxAttempts(method?: string): number {
    if (!this.options.retryEnabled) {
      return 1;
    }

    return normalizeMethod(method) === "GET"
      ? Math.max(1, this.options.retryMaxAttempts ?? 3)
      : 1;
  }

  private shouldRetry(
    method: string | undefined,
    error: unknown,
    attempt: number,
    maxAttempts: number,
  ): boolean {
    if (normalizeMethod(method) !== "GET") {
      return false;
    }

    if (attempt >= maxAttempts) {
      return false;
    }

    if (error instanceof InternalApiError) {
      return [408, 429, 502, 503, 504].includes(error.statusCode);
    }

    if (error instanceof Error) {
      return /timed out|fetch failed|network|ECONNREFUSED|ECONNRESET|EAI_AGAIN/i.test(
        error.message,
      );
    }

    return false;
  }

  private computeDelay(attempt: number): number {
    const initialDelayMs = this.options.retryInitialDelayMs ?? 250;
    const maxDelayMs = this.options.retryMaxDelayMs ?? 2_000;
    const exponentialDelay = Math.min(
      maxDelayMs,
      initialDelayMs * 2 ** Math.max(0, attempt - 1),
    );
    const jitter = Math.round(exponentialDelay * 0.2 * Math.random());

    return Math.min(maxDelayMs, exponentialDelay + jitter);
  }

  private describeError(error: unknown): string {
    if (error instanceof InternalApiError) {
      return `${error.statusCode}`;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "unknown_error";
  }

  private assertCircuitClosed(path: string, method?: string): void {
    if (!this.options.circuitBreakerEnabled) {
      return;
    }

    const openUntil = this.circuitBreakerState?.openUntil;
    if (!openUntil) {
      return;
    }

    if (Date.now() >= openUntil) {
      this.circuitBreakerState = {
        failureCount: 0,
      };
      this.options.onCircuitClose?.({
        path,
        method: normalizeMethod(method),
      });
      return;
    }

    throw new InternalApiError("Internal API circuit breaker is open", 503, {
      path,
      openUntil: new Date(openUntil).toISOString(),
    });
  }

  private onRequestSuccess(path: string, method?: string): void {
    if (!this.options.circuitBreakerEnabled) {
      return;
    }

    const hadFailures = (this.circuitBreakerState?.failureCount ?? 0) > 0;
    this.circuitBreakerState = {
      failureCount: 0,
    };

    if (hadFailures) {
      this.options.onCircuitClose?.({
        path,
        method: normalizeMethod(method),
      });
    }
  }

  private onRequestFailure(
    path: string,
    method: string | undefined,
    error: unknown,
  ): void {
    if (!this.options.circuitBreakerEnabled) {
      return;
    }

    if (!this.shouldCountTowardsCircuit(error)) {
      return;
    }

    const failureThreshold = Math.max(
      1,
      this.options.circuitBreakerFailureThreshold ?? 5,
    );
    const openForMs = Math.max(
      1000,
      this.options.circuitBreakerOpenMs ?? 30_000,
    );
    const failureCount = (this.circuitBreakerState?.failureCount ?? 0) + 1;
    const shouldOpen = failureCount >= failureThreshold;

    this.circuitBreakerState = {
      failureCount,
      openUntil: shouldOpen ? Date.now() + openForMs : undefined,
    };

    if (shouldOpen) {
      this.options.onCircuitOpen?.({
        path,
        method: normalizeMethod(method),
        failureCount,
        openForMs,
      });
    }
  }

  private shouldCountTowardsCircuit(error: unknown): boolean {
    if (error instanceof InternalApiError) {
      return (
        error.statusCode >= 500 ||
        error.statusCode === 408 ||
        error.statusCode === 429
      );
    }

    if (error instanceof Error) {
      return /timed out|fetch failed|network|ECONNREFUSED|ECONNRESET|EAI_AGAIN/i.test(
        error.message,
      );
    }

    return false;
  }
}

function normalizeMethod(method?: string) {
  return (method ?? "GET").toUpperCase();
}

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
