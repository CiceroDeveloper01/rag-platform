import { Injectable } from "@nestjs/common";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  AGENT_EXECUTION_TOTAL,
  AppLoggerService,
  MetricsService,
  ROUTING_FAILURE_TOTAL,
} from "@rag-platform/observability";
import { InboundMessagePayload } from "../queue/inbound-message.types";
import { ConversationAgent } from "./conversation-agent/conversation.agent";
import {
  DocumentAgent,
  FlowExecutionRequest,
} from "./document-agent/document.agent";
import { HandoffAgent } from "./handoff-agent/handoff.agent";
import { AgentDecision, SupervisorAgent } from "./supervisor/supervisor.agent";

const AgentGraphState = Annotation.Root({
  inboundMessage: Annotation<InboundMessagePayload>({
    reducer: (_previous, next) => next,
  }),
  decision: Annotation<AgentDecision | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
  executionRequest: Annotation<FlowExecutionRequest | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
});

type AgentGraphStateType = typeof AgentGraphState.State;

@Injectable()
export class AgentGraphService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly metricsService: MetricsService,
    private readonly supervisorAgent: SupervisorAgent,
    private readonly documentAgent: DocumentAgent,
    private readonly conversationAgent: ConversationAgent,
    private readonly handoffAgent: HandoffAgent,
  ) {}

  async execute(inboundMessage: InboundMessagePayload): Promise<{
    decision: AgentDecision;
    executionRequest: FlowExecutionRequest;
    durationMs: number;
  }> {
    const startedAt = Date.now();

    try {
      const result = await this.buildGraph().invoke({
        inboundMessage,
        decision: null,
        executionRequest: null,
      });

      const decision = this.requireDecision(result.decision);
      const executionRequest = this.requireExecutionRequest(
        result.executionRequest,
      );
      const durationMs = Date.now() - startedAt;

      this.metricsService.increment(AGENT_EXECUTION_TOTAL);
      this.metricsService.record("agent_decision_duration_ms", durationMs);

      this.logger.log(
        "Agent graph execution completed",
        AgentGraphService.name,
        {
          externalMessageId: inboundMessage.externalMessageId,
          targetAgent: decision.targetAgent,
          durationMs,
        },
      );

      return {
        decision,
        executionRequest,
        durationMs,
      };
    } catch (error) {
      this.metricsService.increment(ROUTING_FAILURE_TOTAL);

      this.logger.error(
        "Agent graph execution failed",
        error instanceof Error ? error.stack : undefined,
        AgentGraphService.name,
        {
          externalMessageId: inboundMessage.externalMessageId,
        },
      );

      throw error;
    }
  }

  private requireDecision(decision: AgentDecision | null): AgentDecision {
    if (!decision) {
      throw new Error("Agent decision was not produced");
    }

    return decision;
  }

  private requireExecutionRequest(
    executionRequest: FlowExecutionRequest | null,
  ): FlowExecutionRequest {
    if (!executionRequest) {
      throw new Error("Flow execution request was not produced");
    }

    return executionRequest;
  }

  private buildGraph() {
    return new StateGraph(AgentGraphState)
      .addNode("supervisor", async (state: AgentGraphStateType) => ({
        decision: await this.supervisorAgent.decide(state.inboundMessage),
      }))
      .addNode("document-agent", async (state: AgentGraphStateType) => ({
        executionRequest: await this.documentAgent.plan(
          state.inboundMessage,
          this.requireDecision(state.decision),
        ),
      }))
      .addNode("conversation-agent", async (state: AgentGraphStateType) => ({
        executionRequest: await this.conversationAgent.plan(
          state.inboundMessage,
          this.requireDecision(state.decision),
        ),
      }))
      .addNode("handoff-agent", async (state: AgentGraphStateType) => ({
        executionRequest: await this.handoffAgent.plan(
          state.inboundMessage,
          this.requireDecision(state.decision),
        ),
      }))
      .addEdge(START, "supervisor")
      .addConditionalEdges(
        "supervisor",
        (state: AgentGraphStateType) =>
          this.requireDecision(state.decision).targetAgent,
        {
          "document-agent": "document-agent",
          "conversation-agent": "conversation-agent",
          "handoff-agent": "handoff-agent",
        },
      )
      .addEdge("document-agent", END)
      .addEdge("conversation-agent", END)
      .addEdge("handoff-agent", END)
      .compile();
  }
}
