import { ContextBuilderService } from "./context-builder.service";

describe("ContextBuilderService", () => {
  it("returns a multilingual fallback when no documents are retrieved", () => {
    const service = new ContextBuilderService();

    expect(service.buildContext("Where is my invoice?", [], "en")).toContain(
      "No relevant documents were retrieved.",
    );
    expect(service.buildContext("Onde esta minha fatura?", [], "pt")).toContain(
      "Nenhum documento relevante foi recuperado.",
    );
  });
});
