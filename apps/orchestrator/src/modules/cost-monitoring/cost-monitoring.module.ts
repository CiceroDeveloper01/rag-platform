import { Module } from "@nestjs/common";
import { CostCalculatorService } from "./cost-calculator.service";
import { TokenCounterService } from "./token-counter.service";
import { UsageRepository } from "./usage.repository";

@Module({
  providers: [TokenCounterService, CostCalculatorService, UsageRepository],
  exports: [TokenCounterService, CostCalculatorService, UsageRepository],
})
export class CostMonitoringModule {}
