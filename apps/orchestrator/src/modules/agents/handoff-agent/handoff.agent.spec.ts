import { EXECUTE_HANDOFF_JOB } from "../../queue/queue.constants";
import { HandoffAgent } from "./handoff.agent";

describe("HandoffAgent", () => {
  it("builds an english handoff response payload", async () => {
    const agent = new HandoffAgent({ log: jest.fn() } as any);

    const result = await agent.plan(
      {
        eventType: "message.received",
        channel: "telegram",
        externalMessageId: "handoff-1",
        from: "ada",
        body: "Need a human agent",
        metadata: {
          tenantId: "tenant-a",
        },
        receivedAt: "2026-03-15T12:00:00.000Z",
      } as any,
      {
        intent: "handoff",
        confidence: 0.81,
        targetAgent: "handoff-agent",
        detectedLanguage: "en",
        languageConfidence: 0.92,
        languageUsedFallback: false,
      },
    );

    expect(result.jobName).toBe(EXECUTE_HANDOFF_JOB);
    expect(result.payload.context).toMatchObject({
      handoffMessage: "A human agent handoff was requested.",
      language: "en",
    });
  });

  it("falls back to portuguese handoff messaging", async () => {
    const agent = new HandoffAgent({ log: jest.fn() } as any);

    const result = await agent.plan(
      {
        eventType: "message.received",
        channel: "email",
        externalMessageId: "handoff-2",
        from: "ada@example.com",
        body: "Preciso de suporte",
        receivedAt: "2026-03-15T12:00:00.000Z",
      } as any,
      {
        intent: "handoff",
        confidence: 0.81,
        targetAgent: "handoff-agent",
        detectedLanguage: "pt",
        languageConfidence: 0.8,
        languageUsedFallback: false,
      },
    );

    expect(result.payload.context?.handoffMessage).toBe(
      "Foi solicitada a transferencia para um agente humano.",
    );
  });
});
