import { Injectable } from "@nestjs/common";
import { EvaluationRepository } from "./evaluation.repository";

export interface AgentQualityStats {
  averageQualityScore: number;
  failureRate: number;
  averageRelevanceScore: number;
  averageCoherenceScore: number;
  averageSafetyScore: number;
  totalEvaluations: number;
}

export interface UserFeedbackStats {
  userSatisfaction: number;
  totalFeedbacks: number;
  averageRating: number;
}

@Injectable()
export class EvaluationMetrics {
  constructor(private readonly evaluationRepository: EvaluationRepository) {}

  getAgentQuality(): AgentQualityStats {
    const evaluations = this.evaluationRepository.getEvaluationStats();

    if (evaluations.length === 0) {
      return {
        averageQualityScore: 0,
        failureRate: 0,
        averageRelevanceScore: 0,
        averageCoherenceScore: 0,
        averageSafetyScore: 0,
        totalEvaluations: 0,
      };
    }

    const totals = evaluations.reduce(
      (accumulator, evaluation) => {
        accumulator.relevance += evaluation.relevanceScore;
        accumulator.coherence += evaluation.coherenceScore;
        accumulator.safety += evaluation.safetyScore;
        accumulator.failures +=
          evaluation.relevanceScore < 0.45 ||
          evaluation.coherenceScore < 0.45 ||
          evaluation.safetyScore < 0.6
            ? 1
            : 0;
        return accumulator;
      },
      { relevance: 0, coherence: 0, safety: 0, failures: 0 },
    );

    const averageRelevanceScore = round(totals.relevance / evaluations.length);
    const averageCoherenceScore = round(totals.coherence / evaluations.length);
    const averageSafetyScore = round(totals.safety / evaluations.length);
    const averageQualityScore = round(
      (averageRelevanceScore + averageCoherenceScore + averageSafetyScore) / 3,
    );

    return {
      averageQualityScore,
      failureRate: round(totals.failures / evaluations.length),
      averageRelevanceScore,
      averageCoherenceScore,
      averageSafetyScore,
      totalEvaluations: evaluations.length,
    };
  }

  getUserFeedback(): UserFeedbackStats {
    const feedbacks = this.evaluationRepository.getFeedbackStats();

    if (feedbacks.length === 0) {
      return {
        userSatisfaction: 0,
        totalFeedbacks: 0,
        averageRating: 0,
      };
    }

    const totalRating = feedbacks.reduce(
      (accumulator, feedback) => accumulator + feedback.rating,
      0,
    );

    return {
      userSatisfaction: round(totalRating / (feedbacks.length * 5)),
      totalFeedbacks: feedbacks.length,
      averageRating: round(totalRating / feedbacks.length),
    };
  }
}

function round(value: number): number {
  return Number(value.toFixed(2));
}
