import { Injectable } from "@nestjs/common";
import { Channel } from "@rag-platform/contracts";
import { AgentGraphService } from "../agents/agent.graph";
import { InboundMessagePayload } from "../queue/inbound-message.types";

export interface SimulationScenarioDefinition {
  scenarioName: string;
  inputMessage: string;
  expectedAgent: string;
  expectedAction: string;
  channel?: Channel;
  tenantId?: string;
}

@Injectable()
export class AgentSimulatorService {
  constructor(private readonly agentGraphService: AgentGraphService) {}

  async simulate(scenario: SimulationScenarioDefinition) {
    const inboundMessage: InboundMessagePayload = {
      eventType: "simulation.scenario",
      channel: scenario.channel ?? Channel.EMAIL,
      externalMessageId: `sim:${scenario.scenarioName}`,
      from: "simulation@rag-platform.dev",
      body: scenario.inputMessage,
      receivedAt: new Date().toISOString(),
      metadata: {
        tenantId: scenario.tenantId ?? "default-tenant",
        source: "simulation-lab",
      },
    };

    return this.agentGraphService.execute(inboundMessage);
  }
}
