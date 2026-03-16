import { Injectable } from "@nestjs/common";
import { TrainingDatasetEntry } from "./training-dataset.builder";

export interface PromptOptimizationSuggestion {
  agentName: string;
  issue: string;
  recommendation: string;
  affectedResponseIds: string[];
}

@Injectable()
export class PromptOptimizerService {
  optimizePrompt(
    agentName: string,
    dataset: TrainingDatasetEntry[],
  ): PromptOptimizationSuggestion[] {
    if (dataset.length === 0) {
      return [];
    }

    const suggestions: PromptOptimizationSuggestion[] = [];

    const lowRelevance = dataset.filter((entry) => entry.relevanceScore < 0.45);
    if (lowRelevance.length > 0) {
      suggestions.push({
        agentName,
        issue: "low_relevance",
        recommendation:
          "Clarify the agent prompt to prioritize user intent, retrieved context, and direct answer alignment.",
        affectedResponseIds: lowRelevance.map((entry) => entry.responseId),
      });
    }

    const lowCoherence = dataset.filter((entry) => entry.coherenceScore < 0.45);
    if (lowCoherence.length > 0) {
      suggestions.push({
        agentName,
        issue: "low_coherence",
        recommendation:
          "Tighten response instructions so the agent answers in a single, internally consistent narrative.",
        affectedResponseIds: lowCoherence.map((entry) => entry.responseId),
      });
    }

    const lowSafety = dataset.filter((entry) => entry.safetyScore < 0.6);
    if (lowSafety.length > 0) {
      suggestions.push({
        agentName,
        issue: "low_safety",
        recommendation:
          "Reinforce safety boundaries and refusal behavior before the agent drafts a final answer.",
        affectedResponseIds: lowSafety.map((entry) => entry.responseId),
      });
    }

    const poorFeedback = dataset.filter(
      (entry) =>
        typeof entry.feedbackRating === "number" && entry.feedbackRating <= 2,
    );
    if (poorFeedback.length > 0) {
      suggestions.push({
        agentName,
        issue: "poor_user_feedback",
        recommendation:
          "Revise the prompt to ask one clarifying question when confidence is low instead of overcommitting.",
        affectedResponseIds: poorFeedback.map((entry) => entry.responseId),
      });
    }

    return suggestions;
  }
}
