import { Channel } from "@rag-platform/contracts";
import { ChannelHttpClient } from "./channel-http.client";

describe("ChannelHttpClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it("retries idempotent requests on transient errors", async () => {
    const logger = { warn: jest.fn(), error: jest.fn() } as any;
    const metrics = { increment: jest.fn(), record: jest.fn() } as any;
    const tracing = {
      startSpan: jest.fn(() => ({
        name: "span",
        startedAt: new Date().toISOString(),
      })),
      endSpan: jest.fn(),
    } as any;
    const client = new ChannelHttpClient(logger, metrics, tracing);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue("temporary"),
        headers: { get: jest.fn(() => "text/plain") },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ ok: true }),
        headers: { get: jest.fn(() => "application/json") },
      });

    const payload = await client.requestJson<{ ok: boolean }>({
      channel: Channel.TELEGRAM,
      operation: "polling.getUpdates",
      method: "GET",
      url: "https://example.org",
      timeoutMs: 100,
      retryEnabled: true,
      retryMaxAttempts: 2,
      retryInitialDelayMs: 1,
      retryMaxDelayMs: 1,
      idempotent: true,
    });

    expect(payload).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalled();
  });
});
