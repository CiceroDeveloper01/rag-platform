import { render, screen, waitFor } from "@testing-library/react";
import { CostMonitorPage } from "./CostMonitorPage";
import { analyticsApiService } from "@/src/services/analytics-api.service";

vi.mock("@/src/services/analytics-api.service", () => ({
  analyticsApiService: {
    getAiCost: vi.fn(),
    getTenantUsage: vi.fn(),
  },
}));

describe("CostMonitorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when there is no cost data", async () => {
    vi.mocked(analyticsApiService.getAiCost).mockResolvedValue({
      totalCost: 0,
      costByAgent: [],
    });
    vi.mocked(analyticsApiService.getTenantUsage).mockResolvedValue({
      costByTenant: [],
    });

    render(<CostMonitorPage />);

    expect(screen.getByText("Carregando custos")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText("Ainda nao ha dados suficientes para custo"),
      ).toBeInTheDocument(),
    );
  });

  it("shows an error state when analytics loading fails", async () => {
    vi.mocked(analyticsApiService.getAiCost).mockRejectedValue(
      new Error("unavailable"),
    );
    vi.mocked(analyticsApiService.getTenantUsage).mockRejectedValue(
      new Error("unavailable"),
    );

    render(<CostMonitorPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Nao foi possivel carregar o monitor de custo"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });

  it("renders both charts when cost data is available", async () => {
    vi.mocked(analyticsApiService.getAiCost).mockResolvedValue({
      totalCost: 42,
      costByAgent: [{ agentName: "conversation-agent", cost: 30 }],
    });
    vi.mocked(analyticsApiService.getTenantUsage).mockResolvedValue({
      costByTenant: [{ tenantId: "tenant-a", cost: 42 }],
    });

    render(<CostMonitorPage />);

    await waitFor(() =>
      expect(screen.getByText("Cost per agent")).toBeInTheDocument(),
    );
    expect(screen.getByText("Cost per tenant")).toBeInTheDocument();
  });
});
