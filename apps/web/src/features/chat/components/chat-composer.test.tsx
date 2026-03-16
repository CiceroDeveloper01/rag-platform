import { fireEvent, render, screen } from "@testing-library/react";
import { ChatComposer } from "./chat-composer";

describe("ChatComposer", () => {
  it("submits the typed question with top_k", async () => {
    const onSubmit = vi.fn();

    render(
      <ChatComposer
        isSubmitting={false}
        onSubmit={onSubmit}
        onStop={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Pergunta"), {
      target: { value: "O que e pgvector?" },
    });
    fireEvent.change(screen.getByLabelText("top_k"), {
      target: { value: "7" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Enviar pergunta" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith("O que e pgvector?", {
      topK: 7,
    });
  });

  it("shows stop button while submitting", () => {
    const onStop = vi.fn();

    render(<ChatComposer isSubmitting onSubmit={vi.fn()} onStop={onStop} />);

    fireEvent.click(screen.getByRole("button", { name: "Interromper" }));

    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
