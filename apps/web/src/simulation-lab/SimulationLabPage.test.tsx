import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SimulationLabPage } from "./SimulationLabPage";
import { simulationApiService } from "@/src/services/simulation-api.service";

vi.mock("@/src/services/simulation-api.service", () => ({
  simulationApiService: {
    getScenarios: vi.fn(),
    runScenario: vi.fn(),
  },
}));

describe("SimulationLabPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when there are no scenarios or results", async () => {
    vi.mocked(simulationApiService.getScenarios).mockResolvedValue({
      scenarios: [],
      results: [],
    });

    render(<SimulationLabPage />);

    expect(screen.getByText("Carregando simulacoes")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText("Ainda nao ha cenarios cadastrados"),
      ).toBeInTheDocument(),
    );
  });

  it("shows an error state when the simulation API fails", async () => {
    vi.mocked(simulationApiService.getScenarios).mockRejectedValue(
      new Error("down"),
    );

    render(<SimulationLabPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Nao foi possivel abrir o simulation lab"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });

  it("loads scenarios and appends the newest run result", async () => {
    vi.mocked(simulationApiService.getScenarios).mockResolvedValue({
      scenarios: [
        {
          scenarioName: "Invoice lookup",
          inputMessage: "Where is my invoice?",
          expectedAgent: "conversation-agent",
          expectedAction: "reply-conversation",
        },
      ],
      results: [],
    });
    vi.mocked(simulationApiService.runScenario).mockResolvedValue({
      scenarioId: "Invoice lookup",
      actualAgent: "conversation-agent",
      actualAction: "reply-conversation",
      score: "PASS",
      createdAt: "2026-03-15T12:00:00.000Z",
    });

    render(<SimulationLabPage />);

    await waitFor(() =>
      expect(screen.getByText("Invoice lookup")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Run scenario"));

    await waitFor(() =>
      expect(
        screen.getByText("conversation-agent / reply-conversation"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("PASS")).toBeInTheDocument();
  });

  it("shows an execution error when a scenario run fails", async () => {
    vi.mocked(simulationApiService.getScenarios).mockResolvedValue({
      scenarios: [
        {
          scenarioName: "Invoice lookup",
          inputMessage: "Where is my invoice?",
          expectedAgent: "conversation-agent",
          expectedAction: "reply-conversation",
        },
      ],
      results: [],
    });
    vi.mocked(simulationApiService.runScenario).mockRejectedValue(
      new Error("run failed"),
    );

    render(<SimulationLabPage />);

    await waitFor(() =>
      expect(screen.getByText("Run scenario")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("Run scenario"));

    await waitFor(() =>
      expect(screen.getByText("Execucao indisponivel")).toBeInTheDocument(),
    );
  });
});
