import { Injectable } from "@nestjs/common";

export interface AgentEvaluationRecord {
  responseId: string;
  question: string;
  response: string;
  context?: Record<string, unknown>;
  relevanceScore: number;
  coherenceScore: number;
  safetyScore: number;
  createdAt: string;
}

export interface UserFeedbackRecord {
  responseId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

@Injectable()
export class EvaluationRepository {
  private readonly evaluations: AgentEvaluationRecord[] = [];
  private readonly feedbacks: UserFeedbackRecord[] = [];

  saveEvaluation(record: AgentEvaluationRecord): AgentEvaluationRecord {
    this.evaluations.unshift(record);
    return record;
  }

  saveFeedback(record: UserFeedbackRecord): UserFeedbackRecord {
    this.feedbacks.unshift(record);
    return record;
  }

  getEvaluationStats(): AgentEvaluationRecord[] {
    return [...this.evaluations];
  }

  getFeedbackStats(): UserFeedbackRecord[] {
    return [...this.feedbacks];
  }

  getEvaluationByResponseId(
    responseId: string,
  ): AgentEvaluationRecord | undefined {
    return this.evaluations.find(
      (evaluation) => evaluation.responseId === responseId,
    );
  }
}
