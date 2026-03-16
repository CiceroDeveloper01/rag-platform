module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@rag-platform/config$": "<rootDir>/../../packages/config/src/index.ts",
    "^@rag-platform/contracts$":
      "<rootDir>/../../packages/contracts/src/index.ts",
    "^@rag-platform/observability$":
      "<rootDir>/../../packages/observability/src/index.ts",
    "^@rag-platform/sdk$": "<rootDir>/../../packages/sdk/src/index.ts",
    "^@rag-platform/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@rag-platform/types$": "<rootDir>/../../packages/types/src/index.ts",
    "^@rag-platform/utils$": "<rootDir>/../../packages/utils/src/index.ts",
  },
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/modules/agents/agent.graph.ts",
    "src/modules/agents/language-detection.service.ts",
    "src/modules/agents/conversation-agent/conversation.agent.ts",
    "src/modules/agents/document-agent/document.agent.ts",
    "src/modules/agents/handoff-agent/handoff.agent.ts",
    "src/modules/agents/supervisor/supervisor.agent.ts",
    "src/modules/channels/email.inbound.adapter.ts",
    "src/modules/channels/telegram.inbound.adapter.ts",
    "src/modules/channels/whatsapp.inbound.adapter.ts",
    "src/modules/processors/flow-execution.processor.ts",
    "src/modules/processors/inbound-message.processor.ts",
    "src/modules/rag/document-indexer.service.ts",
    "src/modules/rag/retrieval.service.ts",
    "src/modules/tools/chunk-document.tool.ts",
    "src/modules/tools/document-ingestion.pipeline.ts",
    "src/modules/tools/download-file.tool.ts",
    "src/modules/tools/generate-embeddings.tool.ts",
    "src/modules/tools/index-document.tool.ts",
    "src/modules/tools/parse-document.tool.ts",
    "src/modules/tools/retrieve-documents.tool.ts",
    "src/modules/tools/store-document.tool.ts",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
