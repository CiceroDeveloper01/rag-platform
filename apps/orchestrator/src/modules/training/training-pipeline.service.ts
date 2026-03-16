import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppLoggerService, MetricsService } from "@rag-platform/observability";
import {
  KnowledgeUpdaterService,
  KnowledgeUpdateSuggestion,
} from "./knowledge-updater.service";
import {
  PromptOptimizationSuggestion,
  PromptOptimizerService,
} from "./prompt-optimizer.service";
import {
  TrainingDatasetBuilder,
  TrainingDatasetEntry,
} from "./training-dataset.builder";

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface TrainingRunReport {
  trigger: "schedule" | "manual";
  executedAt: string;
  datasetSize: number;
  lowQualityCount: number;
  promptSuggestions: PromptOptimizationSuggestion[];
  knowledgeSuggestions: KnowledgeUpdateSuggestion[];
}

@Injectable()
export class TrainingPipelineService implements OnModuleInit, OnModuleDestroy {
  private readonly reports: TrainingRunReport[] = [];
  private intervalHandle?: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly trainingDatasetBuilder: TrainingDatasetBuilder,
    private readonly promptOptimizerService: PromptOptimizerService,
    private readonly knowledgeUpdaterService: KnowledgeUpdaterService,
  ) {}

  onModuleInit(): void {
    const enabled = this.configService.get<string>(
      "TRAINING_PIPELINE_ENABLED",
      "true",
    );

    if (enabled === "false") {
      this.logger.warn(
        "Training pipeline is disabled by configuration",
        TrainingPipelineService.name,
      );
      return;
    }

    const intervalMs =
      Number(this.configService.get<string>("TRAINING_PIPELINE_INTERVAL_MS")) ||
      DEFAULT_INTERVAL_MS;

    this.intervalHandle = setInterval(() => {
      void this.runTrainingCycle("schedule");
    }, intervalMs);

    this.logger.log(
      "Training pipeline scheduled",
      TrainingPipelineService.name,
      { intervalMs },
    );
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async runTrainingCycle(
    trigger: "schedule" | "manual" = "manual",
  ): Promise<TrainingRunReport> {
    const dataset = this.trainingDatasetBuilder.buildTrainingDataset();
    const lowQualityDataset = dataset.filter(isLowQualityEntry);

    const promptSuggestions = this.buildPromptSuggestions(lowQualityDataset);
    const knowledgeSuggestions =
      await this.buildKnowledgeSuggestions(lowQualityDataset);

    const report: TrainingRunReport = {
      trigger,
      executedAt: new Date().toISOString(),
      datasetSize: dataset.length,
      lowQualityCount: lowQualityDataset.length,
      promptSuggestions,
      knowledgeSuggestions,
    };

    this.reports.unshift(report);
    this.reports.splice(30);

    this.metricsService.increment("training_pipeline_runs_total");
    this.metricsService.record("training_dataset_size", dataset.length);
    this.metricsService.record(
      "training_low_quality_records",
      lowQualityDataset.length,
    );
    this.metricsService.record(
      "training_prompt_suggestions_total",
      promptSuggestions.length,
    );
    this.metricsService.record(
      "training_knowledge_suggestions_total",
      knowledgeSuggestions.length,
    );

    this.logger.log(
      "Training pipeline completed",
      TrainingPipelineService.name,
      {
        trigger,
        datasetSize: report.datasetSize,
        lowQualityCount: report.lowQualityCount,
        promptSuggestions: report.promptSuggestions.length,
        knowledgeSuggestions: report.knowledgeSuggestions.length,
      },
    );

    return report;
  }

  getReports(): TrainingRunReport[] {
    return [...this.reports];
  }

  private buildPromptSuggestions(
    dataset: TrainingDatasetEntry[],
  ): PromptOptimizationSuggestion[] {
    const datasetByAgent = dataset.reduce<Map<string, TrainingDatasetEntry[]>>(
      (accumulator, entry) => {
        const records = accumulator.get(entry.agentName) ?? [];
        records.push(entry);
        accumulator.set(entry.agentName, records);
        return accumulator;
      },
      new Map(),
    );

    return Array.from(datasetByAgent.entries()).flatMap(
      ([agentName, records]) =>
        this.promptOptimizerService.optimizePrompt(agentName, records),
    );
  }

  private async buildKnowledgeSuggestions(
    dataset: TrainingDatasetEntry[],
  ): Promise<KnowledgeUpdateSuggestion[]> {
    const suggestions: KnowledgeUpdateSuggestion[] = [];

    for (const entry of dataset) {
      if (entry.relevanceScore < 0.45) {
        suggestions.push(
          await this.knowledgeUpdaterService.addDocument(
            entry.question,
            `training-gap:${entry.responseId}`,
          ),
        );
      }
    }

    if (dataset.length > 0) {
      suggestions.push(await this.knowledgeUpdaterService.rebuildEmbeddings());
    }

    return suggestions;
  }
}

function isLowQualityEntry(entry: TrainingDatasetEntry): boolean {
  return (
    entry.averageScore < 0.55 ||
    (typeof entry.feedbackRating === "number" && entry.feedbackRating <= 2)
  );
}
