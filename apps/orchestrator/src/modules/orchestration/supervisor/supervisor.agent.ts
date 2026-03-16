import { Injectable, Logger } from "@nestjs/common";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { InboundMessagePayload } from "../../queue/inbound-message.types";
import {
  SupervisorDecision,
  supervisorDecisionSchema,
} from "./supervisor.types";

const SupervisorState = Annotation.Root({
  inboundMessage: Annotation<InboundMessagePayload>({
    reducer: (_previous, next) => next,
  }),
  decision: Annotation<SupervisorDecision | null>({
    reducer: (_previous, next) => next,
    default: () => null,
  }),
});

type SupervisorGraphState = typeof SupervisorState.State;

@Injectable()
export class SupervisorAgentService {
  private readonly logger = new Logger(SupervisorAgentService.name);
  private readonly graph = new StateGraph(SupervisorState)
    .addNode("supervisor", async (state: SupervisorGraphState) => ({
      decision: this.routeMessage(state.inboundMessage),
    }))
    .addEdge(START, "supervisor")
    .addEdge("supervisor", END)
    .compile();

  async decide(
    inboundMessage: InboundMessagePayload,
  ): Promise<SupervisorDecision> {
    const result = await this.graph.invoke({
      inboundMessage,
      decision: null,
    });

    if (!result.decision) {
      throw new Error("Supervisor decision was not produced");
    }

    this.logger.log(
      `Supervisor routed ${inboundMessage.externalMessageId} to ${result.decision.route}`,
    );

    return result.decision;
  }

  private routeMessage(
    inboundMessage: InboundMessagePayload,
  ): SupervisorDecision {
    const normalizedMessage = [
      inboundMessage.subject ?? "",
      inboundMessage.body,
    ]
      .join(" ")
      .toLowerCase();

    if (
      (inboundMessage.attachments?.length ?? 0) > 0 ||
      normalizedMessage.includes("documento") ||
      normalizedMessage.includes("pdf") ||
      normalizedMessage.includes("arquivo")
    ) {
      return supervisorDecisionSchema.parse({
        route: "document-agent",
        reason: "Message references files or document operations.",
        confidence: 0.82,
      });
    }

    if (
      normalizedMessage.includes("humano") ||
      normalizedMessage.includes("atendente") ||
      normalizedMessage.includes("suporte")
    ) {
      return supervisorDecisionSchema.parse({
        route: "handoff-agent",
        reason: "Message indicates human handoff intent.",
        confidence: 0.78,
      });
    }

    return supervisorDecisionSchema.parse({
      route: "conversation-agent",
      reason: "Default conversational flow.",
      confidence: 0.74,
    });
  }
}
