import { Injectable } from "@nestjs/common";
import { EvaluationRepository } from "../evaluation/evaluation.repository";

export interface TrainingDatasetEntry {
  responseId: string;
  agentName: string;
  question: string;
  response: string;
  context?: Record<string, unknown>;
  relevanceScore: number;
  coherenceScore: number;
  safetyScore: number;
  averageScore: number;
  feedbackRating?: number;
  feedbackComment?: string;
  createdAt: string;
}

@Injectable()
export class TrainingDatasetBuilder {
  constructor(private readonly evaluationRepository: EvaluationRepository) {}

  buildTrainingDataset(): TrainingDatasetEntry[] {
    const feedbackByResponseId = new Map(
      this.evaluationRepository
        .getFeedbackStats()
        .map((feedback) => [feedback.responseId, feedback] as const),
    );

    return this.evaluationRepository.getEvaluationStats().map((evaluation) => {
      const feedback = feedbackByResponseId.get(evaluation.responseId);

      return {
        responseId: evaluation.responseId,
        agentName: getAgentName(evaluation.context),
        question: evaluation.question,
        response: evaluation.response,
        context: evaluation.context,
        relevanceScore: evaluation.relevanceScore,
        coherenceScore: evaluation.coherenceScore,
        safetyScore: evaluation.safetyScore,
        averageScore: round(
          (evaluation.relevanceScore +
            evaluation.coherenceScore +
            evaluation.safetyScore) /
            3,
        ),
        feedbackRating: feedback?.rating,
        feedbackComment: feedback?.comment,
        createdAt: evaluation.createdAt,
      };
    });
  }
}

function getAgentName(context?: Record<string, unknown>): string {
  const decision = context?.decision;

  if (
    decision &&
    typeof decision === "object" &&
    "targetAgent" in decision &&
    typeof decision.targetAgent === "string"
  ) {
    return decision.targetAgent;
  }

  return "unknown-agent";
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
