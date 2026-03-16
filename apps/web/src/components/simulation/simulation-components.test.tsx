import { fireEvent, render, screen } from "@testing-library/react";
import { SimulationResultsTable } from "./SimulationResultsTable";
import { SimulationScenarioList } from "./SimulationScenarioList";

describe("simulation components", () => {
  it("renders scenario cards and triggers the selected run callback", () => {
    const onRun = vi.fn();
    render(
      <SimulationScenarioList
        scenarios={[
          {
            scenarioName: "Invoice lookup",
            inputMessage: "Where is my invoice?",
            expectedAgent: "conversation-agent",
            expectedAction: "reply-conversation",
          },
        ]}
        onRun={onRun}
      />,
    );

    fireEvent.click(screen.getByText("Run scenario"));

    expect(onRun).toHaveBeenCalledWith(
      expect.objectContaining({
        scenarioName: "Invoice lookup",
      }),
    );
  });

  it("renders both empty and populated result states", () => {
    const { rerender } = render(<SimulationResultsTable results={[]} />);

    expect(screen.getByText("No simulation runs yet.")).toBeInTheDocument();

    rerender(
      <SimulationResultsTable
        results={[
          {
            scenarioId: "Invoice lookup",
            actualAgent: "conversation-agent",
            actualAction: "reply-conversation",
            score: "FAIL",
            createdAt: "2026-03-15T12:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("FAIL")).toBeInTheDocument();
    expect(
      screen.getByText("conversation-agent / reply-conversation"),
    ).toBeInTheDocument();
  });
});
