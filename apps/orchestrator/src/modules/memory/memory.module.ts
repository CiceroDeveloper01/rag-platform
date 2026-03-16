import { Module } from "@nestjs/common";
import {
  LoggerModule,
  MetricsService,
  TracingModule,
} from "@rag-platform/observability";
import { InternalApiModule } from "../internal-api/internal-api.module";
import { RagModule } from "../rag/rag.module";
import { ConversationMemoryService } from "./conversation-memory.service";
import { MemoryContextBuilder } from "./memory-context.builder";

@Module({
  imports: [LoggerModule, TracingModule, RagModule, InternalApiModule],
  providers: [MetricsService, ConversationMemoryService, MemoryContextBuilder],
  exports: [ConversationMemoryService, MemoryContextBuilder],
})
export class MemoryModule {}
