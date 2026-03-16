import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConnectorStatusList } from "./connector-status-list";

describe("ConnectorStatusList", () => {
  it("renders a loading state", () => {
    render(
      <ConnectorStatusList
        connectors={[]}
        isLoading
        error={null}
        onToggleConnector={async () => undefined}
      />,
    );

    expect(screen.getByText("Carregando conectores")).toBeInTheDocument();
  });

  it("renders connector status data and triggers toggle", async () => {
    const onToggleConnector = vi.fn(async () => undefined);

    render(
      <ConnectorStatusList
        connectors={[
          {
            id: 1,
            channel: "TELEGRAM",
            name: "telegram-default",
            isEnabled: true,
            healthStatus: "HEALTHY",
            lastHealthCheckAt: "2026-03-13T12:00:00.000Z",
          },
        ]}
        isLoading={false}
        error={null}
        onToggleConnector={onToggleConnector}
      />,
    );

    expect(screen.getByText("telegram-default")).toBeInTheDocument();
    expect(screen.getByText("HEALTHY")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Desabilitar telegram-default" }),
    );

    await waitFor(() => expect(onToggleConnector).toHaveBeenCalledTimes(1));
  });
});
