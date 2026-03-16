import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { EvaluationMetrics } from "./evaluation.metrics";
import { EvaluationRepository } from "./evaluation.repository";
import { FeedbackService } from "./feedback.service";
import { ResponseEvaluatorService } from "./response-evaluator.service";

@Module({
  imports: [LoggerModule],
  providers: [
    EvaluationRepository,
    ResponseEvaluatorService,
    FeedbackService,
    EvaluationMetrics,
  ],
  exports: [
    EvaluationRepository,
    ResponseEvaluatorService,
    FeedbackService,
    EvaluationMetrics,
  ],
})
export class EvaluationModule {}
