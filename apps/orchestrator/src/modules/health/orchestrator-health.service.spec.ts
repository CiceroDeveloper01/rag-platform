jest.mock("redis", () => ({
  createClient: jest.fn(),
}));

import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { OrchestratorHealthService } from "./orchestrator-health.service";

describe("OrchestratorHealthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it("reports ready when redis and internal api are available", async () => {
    (createClient as jest.Mock).mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue("PONG"),
      disconnect: jest.fn().mockResolvedValue(undefined),
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const service = new OrchestratorHealthService(
      new ConfigService({
        APP_NAME: "orchestrator",
        APP_VERSION: "1.0.0",
        INTERNAL_API_BASE_URL: "http://api:3000",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
      }),
    );

    await expect(service.ready()).resolves.toEqual(
      expect.objectContaining({
        status: "ready",
      }),
    );
  });
});
