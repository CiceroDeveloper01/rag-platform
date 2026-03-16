import "reflect-metadata";
import { createServer } from "node:http";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { OrchestratorHealthService } from "./modules/health/orchestrator-health.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });

  const logger = new Logger("OrchestratorBootstrap");
  app.useLogger(logger);
  const configService = app.get(ConfigService);
  const healthService = app.get(OrchestratorHealthService);
  const port = configService.get<number>("app.port", 3001) ?? 3001;

  const server = createServer(async (request, response) => {
    const path = request.url ?? "/";

    try {
      if (path === "/live" || path === "/health/live") {
        return writeJson(response, 200, await healthService.live());
      }

      if (path === "/ready" || path === "/health/ready") {
        const payload = await healthService.ready();
        return writeJson(
          response,
          payload.status === "ready" ? 200 : 503,
          payload,
        );
      }

      if (path === "/health") {
        const payload = await healthService.health();
        return writeJson(
          response,
          payload.readiness.status === "ready" ? 200 : 503,
          payload,
        );
      }

      return writeJson(response, 404, {
        status: "not_found",
      });
    } catch (error) {
      return writeJson(response, 500, {
        status: "error",
        message: error instanceof Error ? error.message : "health_server_error",
      });
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, "0.0.0.0", () => resolve());
  });

  logger.log(`Orchestrator runtime started on http://0.0.0.0:${port}`);

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Received ${signal}. Shutting down orchestrator runtime.`);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();

function writeJson(
  response: {
    statusCode: number;
    setHeader(name: string, value: string): void;
    end(body: string): void;
  },
  statusCode: number,
  payload: unknown,
) {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(payload));
}
