import { act, renderHook, waitFor } from "@testing-library/react";
import { useOmnichannelOverview } from "./use-omnichannel-overview";
import { omnichannelService } from "../services/omnichannel.service";

vi.mock("../services/omnichannel.service", () => ({
  omnichannelService: {
    getOverview: vi.fn(),
    getChannelMetrics: vi.fn(),
    getLatencyMetrics: vi.fn(),
    getRagUsage: vi.fn(),
    listRequests: vi.fn(),
  },
}));

describe("useOmnichannelOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns overview data after a successful request", async () => {
    vi.mocked(omnichannelService.getOverview).mockResolvedValue({
      totalRequests: 12,
      successCount: 11,
      errorCount: 1,
      avgLatencyMs: 90,
      p95LatencyMs: 180,
      ragUsagePercentage: 50,
      activeConnectors: 2,
      requestsLast24h: 4,
      requestsLast7d: 10,
      channels: [],
    });
    vi.mocked(omnichannelService.getChannelMetrics).mockResolvedValue([]);
    vi.mocked(omnichannelService.getLatencyMetrics).mockResolvedValue([]);
    vi.mocked(omnichannelService.getRagUsage).mockResolvedValue({
      totalExecutions: 12,
      ragExecutions: 6,
      ragUsagePercentage: 50,
      channels: [],
    });
    vi.mocked(omnichannelService.listRequests).mockResolvedValue({
      items: [],
      pagination: { total: 0, limit: 10, offset: 0 },
    });

    const { result } = renderHook(() => useOmnichannelOverview());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.overview.totalRequests).toBe(12);
  });

  it("captures API errors in hook state", async () => {
    vi.mocked(omnichannelService.getOverview).mockRejectedValue(
      new Error("overview failed"),
    );
    vi.mocked(omnichannelService.getChannelMetrics).mockResolvedValue([]);
    vi.mocked(omnichannelService.getLatencyMetrics).mockResolvedValue([]);
    vi.mocked(omnichannelService.getRagUsage).mockResolvedValue({
      totalExecutions: 0,
      ragExecutions: 0,
      ragUsagePercentage: 0,
      channels: [],
    });
    vi.mocked(omnichannelService.listRequests).mockResolvedValue({
      items: [],
      pagination: { total: 0, limit: 10, offset: 0 },
    });

    const { result } = renderHook(() => useOmnichannelOverview());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain("overview failed");

    await act(async () => {
      await result.current.refetch();
    });
  });

  it("does not refetch on rerender when filters keep the same values", async () => {
    vi.mocked(omnichannelService.getOverview).mockResolvedValue({
      totalRequests: 12,
      successCount: 11,
      errorCount: 1,
      avgLatencyMs: 90,
      p95LatencyMs: 180,
      ragUsagePercentage: 50,
      activeConnectors: 2,
      requestsLast24h: 4,
      requestsLast7d: 10,
      channels: [],
    });
    vi.mocked(omnichannelService.getChannelMetrics).mockResolvedValue([]);
    vi.mocked(omnichannelService.getLatencyMetrics).mockResolvedValue([]);
    vi.mocked(omnichannelService.getRagUsage).mockResolvedValue({
      totalExecutions: 12,
      ragExecutions: 6,
      ragUsagePercentage: 50,
      channels: [],
    });
    vi.mocked(omnichannelService.listRequests).mockResolvedValue({
      items: [],
      pagination: { total: 0, limit: 10, offset: 0 },
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useOmnichannelOverview(filters),
      {
        initialProps: {
          filters: {},
        },
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const overviewCallsBeforeRerender = vi.mocked(
      omnichannelService.getOverview,
    ).mock.calls.length;
    const requestCallsBeforeRerender = vi.mocked(
      omnichannelService.listRequests,
    ).mock.calls.length;

    rerender({ filters: {} });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(omnichannelService.getOverview).toHaveBeenCalledTimes(
      overviewCallsBeforeRerender,
    );
    expect(omnichannelService.listRequests).toHaveBeenCalledTimes(
      requestCallsBeforeRerender,
    );
  });
});
