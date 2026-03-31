import {
  AGENT_EXECUTION_TOTAL,
  ROUTING_FAILURE_TOTAL,
} from "@rag-platform/observability";
import { AgentGraphService } from "./agent.graph";

describe("AgentGraphService", () => {
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
  };
  const metricsService = {
    increment: jest.fn(),
    record: jest.fn(),
  };
  const inboundMessage = {
    eventType: "message.received",
    channel: "telegram",
    externalMessageId: "msg-1",
    from: "ada",
    body: "hello",
    receivedAt: "2026-03-15T12:00:00.000Z",
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes a conversation decision to the conversation agent", async () => {
    const service = new AgentGraphService(
      logger as any,
      metricsService as any,
      {
        decide: jest.fn().mockResolvedValue({
          intent: "reply-conversation",
          confidence: 0.9,
          targetAgent: "conversation-agent",
          detectedLanguage: "en",
          languageConfidence: 0.9,
          languageUsedFallback: false,
        }),
      } as any,
      { plan: jest.fn() } as any,
      {
        plan: jest.fn().mockResolvedValue({
          jobName: "execute.reply-conversation",
          payload: {
            channel: "telegram",
            externalMessageId: "msg-1",
            context: {},
          },
        }),
      } as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
    );

    const result = await service.execute(inboundMessage);

    expect(result.decision.targetAgent).toBe("conversation-agent");
    expect(result.executionRequest.jobName).toBe("execute.reply-conversation");
    expect(metricsService.increment).toHaveBeenCalledWith(
      AGENT_EXECUTION_TOTAL,
    );
    expect(metricsService.record).toHaveBeenCalledWith(
      "agent_decision_duration_ms",
      expect.any(Number),
    );
  });

  it("routes a document decision to the document agent", async () => {
    const documentAgent = {
      plan: jest.fn().mockResolvedValue({
        jobName: "execute.register-document",
        payload: {
          channel: "telegram",
          externalMessageId: "msg-1",
          context: {},
        },
      }),
    };
    const service = new AgentGraphService(
      logger as any,
      metricsService as any,
      {
        decide: jest.fn().mockResolvedValue({
          intent: "register-document",
          confidence: 0.98,
          targetAgent: "document-agent",
          detectedLanguage: "pt",
          languageConfidence: 0.9,
          languageUsedFallback: false,
        }),
      } as any,
      documentAgent as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
    );

    const result = await service.execute({
      ...inboundMessage,
      messageType: "document",
    });

    expect(documentAgent.plan).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: "document" }),
      expect.objectContaining({ targetAgent: "document-agent" }),
    );
    expect(result.executionRequest.jobName).toBe("execute.register-document");
  });

  it("routes a handoff decision to the handoff agent", async () => {
    const handoffAgent = {
      plan: jest.fn().mockResolvedValue({
        jobName: "execute.handoff",
        payload: {
          channel: "telegram",
          externalMessageId: "msg-1",
          context: {},
        },
      }),
    };
    const service = new AgentGraphService(
      logger as any,
      metricsService as any,
      {
        decide: jest.fn().mockResolvedValue({
          intent: "handoff",
          confidence: 0.81,
          targetAgent: "handoff-agent",
          detectedLanguage: "es",
          languageConfidence: 0.88,
          languageUsedFallback: false,
        }),
      } as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
      handoffAgent as any,
      { plan: jest.fn() } as any,
    );

    const result = await service.execute({
      ...inboundMessage,
      body: "Necesito soporte humano urgente",
    });

    expect(handoffAgent.plan).toHaveBeenCalled();
    expect(result.executionRequest.jobName).toBe("execute.handoff");
  });

  it("records a routing failure when execution crashes", async () => {
    const service = new AgentGraphService(
      logger as any,
      metricsService as any,
      {
        decide: jest.fn().mockRejectedValue(new Error("decision failed")),
      } as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
      { plan: jest.fn() } as any,
    );

    await expect(service.execute(inboundMessage)).rejects.toThrow(
      "decision failed",
    );

    expect(metricsService.increment).toHaveBeenCalledWith(
      ROUTING_FAILURE_TOTAL,
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
