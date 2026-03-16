import { Module } from "@nestjs/common";
import { LoggerModule } from "@rag-platform/observability";
import { ActionValidatorService } from "./action-validator.service";
import { OutputFilterService } from "./output-filter.service";
import { PolicyEngineService } from "./policy-engine.service";
import { PromptInjectionGuard } from "./prompt-injection.guard";
import { SecurityEventLogger } from "./security-event.logger";

@Module({
  imports: [LoggerModule],
  providers: [
    SecurityEventLogger,
    PromptInjectionGuard,
    PolicyEngineService,
    ActionValidatorService,
    OutputFilterService,
  ],
  exports: [
    SecurityEventLogger,
    PromptInjectionGuard,
    PolicyEngineService,
    ActionValidatorService,
    OutputFilterService,
  ],
})
export class GuardrailsModule {}
