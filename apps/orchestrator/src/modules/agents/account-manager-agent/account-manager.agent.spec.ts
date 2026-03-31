import { Channel } from "@rag-platform/contracts";
import { AccountManagerAgent } from "./account-manager.agent";

describe("AccountManagerAgent", () => {
  it("builds a reply-conversation job with orchestrated banking context", async () => {
    const agent = new AccountManagerAgent(
      { log: jest.fn() } as any,
      {
        execute: jest.fn().mockResolvedValue({
          decision: {
            intent: "INVESTMENT_ADVISORY",
            specialist: "investment",
          },
          responseText: "Simulacao pronta",
          llmContext: "contexto rag",
          retrievedDocuments: [],
          toolCalls: ["SimulateInvestment"],
          responseMetadata: {
            intentDetected: "INVESTMENT_ADVISORY",
          },
          handoffRequested: false,
          aiUsage: {
            usedRag: true,
            usedLlm: false,
          },
        }),
      } as any,
      { plan: jest.fn() } as any,
    );

    const result = await agent.plan(
      {
        channel: Channel.TELEGRAM,
        eventType: "message.received",
        externalMessageId: "telegram:banking:1",
        from: "user-1",
        body: "Quero investir 5 mil em CDB",
        receivedAt: new Date().toISOString(),
        metadata: {
          tenantId: "tenant-a",
        },
      },
      {
        intent: "account-manager",
        confidence: 0.9,
        targetAgent: "account-manager-agent",
        detectedLanguage: "pt",
        languageConfidence: 0.8,
        languageUsedFallback: false,
      },
    );

    expect(result).toMatchObject({
      jobName: "execute.reply-conversation",
      payload: {
        context: expect.objectContaining({
          responseText: "Simulacao pronta",
          toolCalls: ["SimulateInvestment"],
          llmContext: undefined,
          aiUsage: {
            usedRag: true,
            usedLlm: false,
          },
        }),
      },
    });
  });

  it("reuses the real handoff pipeline when the orchestrator requests handoff", async () => {
    const handoffAgent = {
      plan: jest.fn().mockResolvedValue({
        jobName: "execute.handoff",
        payload: {
          channel: "telegram",
          externalMessageId: "telegram:banking:2",
          context: {
            handoffMessage: "fallback",
            metadata: {},
          },
        },
      }),
    };
    const agent = new AccountManagerAgent(
      { log: jest.fn() } as any,
      {
        execute: jest.fn().mockResolvedValue({
          decision: {
            intent: "HUMAN_HANDOFF",
            specialist: null,
          },
          responseText:
            "Estou encaminhando seu caso para um especialista humano dar continuidade.",
          retrievedDocuments: [],
          toolCalls: [],
          responseMetadata: {
            handoffRequested: true,
          },
          handoffRequested: true,
          aiUsage: {
            usedRag: false,
            usedLlm: false,
          },
        }),
      } as any,
      handoffAgent as any,
    );

    const result = await agent.plan(
      {
        channel: Channel.TELEGRAM,
        eventType: "message.received",
        externalMessageId: "telegram:banking:2",
        from: "user-2",
        body: "I need a human agent",
        receivedAt: new Date().toISOString(),
      },
      {
        intent: "account-manager",
        confidence: 0.9,
        targetAgent: "account-manager-agent",
        detectedLanguage: "en",
        languageConfidence: 0.9,
        languageUsedFallback: false,
      },
    );

    expect(handoffAgent.plan).toHaveBeenCalled();
    expect(result.jobName).toBe("execute.handoff");
    expect(result.payload.context).toMatchObject({
      handoffMessage:
        "Estou encaminhando seu caso para um especialista humano dar continuidade.",
    });
  });
});
