import { render, screen } from "@testing-library/react";
import { SummaryCards } from "./summary-cards";

describe("SummaryCards", () => {
  it("renders the omnichannel overview metrics", () => {
    render(
      <SummaryCards
        overview={{
          totalRequests: 120,
          successCount: 110,
          errorCount: 10,
          avgLatencyMs: 180,
          p95LatencyMs: 420,
          ragUsagePercentage: 64,
          activeConnectors: 2,
          requestsLast24h: 40,
          requestsLast7d: 90,
          channels: [],
        }}
      />,
    );

    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("110")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("180 ms")).toBeInTheDocument();
    expect(screen.getByText("420 ms")).toBeInTheDocument();
    expect(screen.getByText("64%")).toBeInTheDocument();
  });
});
