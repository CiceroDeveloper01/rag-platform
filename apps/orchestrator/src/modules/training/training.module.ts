import { Module } from "@nestjs/common";
import { LoggerModule, MetricsService } from "@rag-platform/observability";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { RagModule } from "../rag/rag.module";
import { KnowledgeUpdaterService } from "./knowledge-updater.service";
import { PromptOptimizerService } from "./prompt-optimizer.service";
import { TrainingDatasetBuilder } from "./training-dataset.builder";
import { TrainingPipelineService } from "./training-pipeline.service";

@Module({
  imports: [LoggerModule, EvaluationModule, RagModule],
  providers: [
    MetricsService,
    TrainingDatasetBuilder,
    PromptOptimizerService,
    KnowledgeUpdaterService,
    TrainingPipelineService,
  ],
  exports: [TrainingPipelineService],
})
export class TrainingModule {}
