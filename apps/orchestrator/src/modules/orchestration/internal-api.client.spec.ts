import { InternalApiClient } from "@rag-platform/sdk";
import { InternalApiError } from "@rag-platform/shared";

describe("InternalApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it("retries a transient GET failure and eventually succeeds", async () => {
    const onRetryAttempt = jest.fn();
    const client = new InternalApiClient({
      baseUrl: "http://internal.test",
      retryEnabled: true,
      retryMaxAttempts: 3,
      retryInitialDelayMs: 0,
      retryMaxDelayMs: 0,
      onRetryAttempt,
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createResponse({ ok: false, status: 503 }))
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          json: { ok: true },
        }),
      );

    await expect(client.get("/health")).resolves.toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(onRetryAttempt).toHaveBeenCalledTimes(1);
  });

  it("fails after exhausting retries for transient errors", async () => {
    const onFinalFailure = jest.fn();
    const client = new InternalApiClient({
      baseUrl: "http://internal.test",
      retryEnabled: true,
      retryMaxAttempts: 2,
      retryInitialDelayMs: 0,
      retryMaxDelayMs: 0,
      onFinalFailure,
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createResponse({ ok: false, status: 503 }))
      .mockResolvedValueOnce(createResponse({ ok: false, status: 503 }));

    await expect(client.get("/health")).rejects.toBeInstanceOf(
      InternalApiError,
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(onFinalFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/health",
        method: "GET",
        attempts: 2,
        reason: "503",
      }),
    );
  });

  it("does not retry non-transient client errors", async () => {
    const onRetryAttempt = jest.fn();
    const client = new InternalApiClient({
      baseUrl: "http://internal.test",
      retryEnabled: true,
      retryMaxAttempts: 3,
      retryInitialDelayMs: 0,
      retryMaxDelayMs: 0,
      onRetryAttempt,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createResponse({ ok: false, status: 400 }),
    );

    await expect(client.get("/health")).rejects.toBeInstanceOf(
      InternalApiError,
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(onRetryAttempt).not.toHaveBeenCalled();
  });

  it("retries timeouts when the request is idempotent", async () => {
    const onRetryAttempt = jest.fn();
    const client = new InternalApiClient({
      baseUrl: "http://internal.test",
      timeoutMs: 10,
      retryEnabled: true,
      retryMaxAttempts: 2,
      retryInitialDelayMs: 0,
      retryMaxDelayMs: 0,
      onRetryAttempt,
    });

    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))
      .mockResolvedValueOnce(
        createResponse({
          ok: true,
          status: 200,
          json: { ok: true },
        }),
      );

    await expect(client.get("/health")).resolves.toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(onRetryAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: expect.stringContaining("timed out"),
      }),
    );
  });

  it("opens the circuit breaker after repeated failures and short-circuits requests", async () => {
    const onCircuitOpen = jest.fn();
    const client = new InternalApiClient({
      baseUrl: "http://internal.test",
      retryEnabled: false,
      circuitBreakerEnabled: true,
      circuitBreakerFailureThreshold: 2,
      circuitBreakerOpenMs: 60_000,
      onCircuitOpen,
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createResponse({ ok: false, status: 503 }))
      .mockResolvedValueOnce(createResponse({ ok: false, status: 503 }));

    await expect(client.get("/health")).rejects.toBeInstanceOf(
      InternalApiError,
    );
    await expect(client.get("/health")).rejects.toBeInstanceOf(
      InternalApiError,
    );
    await expect(client.get("/health")).rejects.toBeInstanceOf(
      InternalApiError,
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(onCircuitOpen).toHaveBeenCalledTimes(1);
  });
});

function createResponse({
  ok,
  status,
  json,
}: {
  ok: boolean;
  status: number;
  json?: unknown;
}) {
  return {
    ok,
    status,
    headers: {
      get: jest.fn().mockReturnValue(json ? "application/json" : "text/plain"),
    },
    json: jest.fn().mockResolvedValue(json),
    text: jest.fn().mockResolvedValue(json ? JSON.stringify(json) : ""),
  } as Response;
}
