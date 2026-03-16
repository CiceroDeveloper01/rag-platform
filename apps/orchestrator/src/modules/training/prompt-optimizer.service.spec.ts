import { PromptOptimizerService } from "./prompt-optimizer.service";

describe("PromptOptimizerService", () => {
  it("creates prompt suggestions for low-quality datasets", () => {
    const service = new PromptOptimizerService();

    const suggestions = service.optimizePrompt("conversation-agent", [
      {
        responseId: "resp-1",
        agentName: "conversation-agent",
        question: "Pergunta",
        response: "Resposta",
        relevanceScore: 0.3,
        coherenceScore: 0.4,
        safetyScore: 0.5,
        averageScore: 0.4,
        feedbackRating: 1,
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(suggestions.map((suggestion) => suggestion.issue)).toEqual([
      "low_relevance",
      "low_coherence",
      "low_safety",
      "poor_user_feedback",
    ]);
  });
});
