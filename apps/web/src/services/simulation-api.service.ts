"use client";

import { apiRequest } from "@/src/lib/api/api-client";

export interface SimulationScenarioResponse {
  scenarioName: string;
  inputMessage: string;
  expectedAgent: string;
  expectedAction: string;
}

export interface SimulationResultResponse {
  scenarioId: string;
  actualAgent: string;
  actualAction: string;
  score: "PASS" | "FAIL";
  createdAt: string;
}

export const simulationApiService = {
  getScenarios() {
    return apiRequest<{
      scenarios: SimulationScenarioResponse[];
      results: SimulationResultResponse[];
    }>("/simulation/scenarios");
  },

  runScenario(payload: SimulationScenarioResponse) {
    return apiRequest<SimulationResultResponse>("/simulation/run", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
