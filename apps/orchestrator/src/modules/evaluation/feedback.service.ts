import { Injectable } from "@nestjs/common";
import { AppLoggerService } from "@rag-platform/observability";
import {
  EvaluationRepository,
  UserFeedbackRecord,
} from "./evaluation.repository";

@Injectable()
export class FeedbackService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  registerFeedback(
    responseId: string,
    rating: number,
    comment?: string,
  ): UserFeedbackRecord {
    const feedback = this.evaluationRepository.saveFeedback({
      responseId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });

    this.logger.debug("User feedback registered", FeedbackService.name, {
      responseId,
      rating,
    });

    return feedback;
  }
}
