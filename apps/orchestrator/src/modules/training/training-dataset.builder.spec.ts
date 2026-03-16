import { EvaluationRepository } from "../evaluation/evaluation.repository";
import { TrainingDatasetBuilder } from "./training-dataset.builder";

describe("TrainingDatasetBuilder", () => {
  it("merges evaluations and feedback into a training dataset", () => {
    const repository = new EvaluationRepository();
    const builder = new TrainingDatasetBuilder(repository);

    repository.saveEvaluation({
      responseId: "resp-1",
      question: "Onde esta minha fatura?",
      response: "Sua fatura esta no portal.",
      context: {
        decision: {
          targetAgent: "conversation-agent",
        },
      },
      relevanceScore: 0.4,
      coherenceScore: 0.6,
      safetyScore: 0.9,
      createdAt: new Date().toISOString(),
    });
    repository.saveFeedback({
      responseId: "resp-1",
      rating: 2,
      comment: "Resposta incompleta",
      createdAt: new Date().toISOString(),
    });

    const dataset = builder.buildTrainingDataset();

    expect(dataset).toHaveLength(1);
    expect(dataset[0]).toMatchObject({
      responseId: "resp-1",
      agentName: "conversation-agent",
      feedbackRating: 2,
      feedbackComment: "Resposta incompleta",
    });
    expect(dataset[0]?.averageScore).toBe(0.63);
  });
});
