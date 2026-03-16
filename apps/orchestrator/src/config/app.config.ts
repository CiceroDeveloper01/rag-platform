import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  name: process.env.APP_NAME ?? "rag-platform-orchestrator",
  version: process.env.APP_VERSION ?? "0.0.1",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
}));
