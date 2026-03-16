import { Body, Controller, Get, Post } from '@nestjs/common';
import { SimulationService } from './simulation.service';

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('scenarios')
  getScenarios() {
    return {
      scenarios: this.simulationService.getScenarios(),
      results: this.simulationService.getResults(),
    };
  }

  @Post('run')
  runScenario(
    @Body()
    scenario: {
      scenarioName: string;
      inputMessage: string;
      expectedAgent: string;
      expectedAction: string;
    },
  ) {
    return this.simulationService.runScenario(scenario);
  }
}
