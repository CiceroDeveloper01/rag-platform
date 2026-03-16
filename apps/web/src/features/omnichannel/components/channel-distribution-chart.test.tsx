import { render, screen } from "@testing-library/react";
import { ChannelDistributionChart } from "./channel-distribution-chart";

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

describe("ChannelDistributionChart", () => {
  it("renders the chart title and accessibility label", () => {
    render(
      <ChannelDistributionChart
        data={[
          {
            channel: "TELEGRAM",
            totalRequests: 20,
            successCount: 18,
            errorCount: 2,
          },
        ]}
      />,
    );

    expect(screen.getByText("Requisicoes por canal")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Grafico de distribuicao por canal"),
    ).toBeInTheDocument();
  });
});
