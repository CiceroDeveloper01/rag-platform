import { ConfigService } from "@nestjs/config";
import { HttpException, ServiceUnavailableException } from "@nestjs/common";
import { DocumentsProxyService } from "./documents-proxy.service";

describe("DocumentsProxyService", () => {
  const logger = {
    setContext: jest.fn(),
    error: jest.fn(),
  };
  const internalServiceTokenService = {
    issueToken: jest.fn().mockReturnValue("service-token"),
  };
  const configService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === "businessApi.baseUrl") {
        return "http://api-business:3000";
      }

      throw new Error(`Unexpected getOrThrow key: ${key}`);
    }),
    get: jest.fn((key: string, fallback?: number) => {
      if (key === "businessApi.timeoutMs") {
        return 1_000;
      }

      return fallback;
    }),
  } as unknown as ConfigService;

  const service = new DocumentsProxyService(
    configService,
    logger as never,
    internalServiceTokenService as never,
  );

  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as never;
  });

  it("signs internal service calls to api-business", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    await expect(
      service.listSources(
        { page: 1 },
        {
          requestId: "req-1",
          tenantId: "tenant-a",
        },
      ),
    ).resolves.toEqual({ items: [] });

    expect(internalServiceTokenService.issueToken).toHaveBeenCalledWith([
      "business:documents:read",
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/sources?page=1", "http://api-business:3000"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          authorization: "Bearer service-token",
          "x-request-id": "req-1",
          "x-tenant-id": "tenant-a",
        }),
      }),
    );
  });

  it("propagates HTTP errors returned by api-business", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        statusCode: 403,
        message: "Forbidden",
      }),
    });

    await expect(
      service.listSources({}, { requestId: "req-2", tenantId: "tenant-a" }),
    ).rejects.toEqual(new HttpException("Forbidden", 403));
  });

  it("wraps network failures as service unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("fetch failed"));

    await expect(
      service.listSources({}, { requestId: "req-3", tenantId: "tenant-a" }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
