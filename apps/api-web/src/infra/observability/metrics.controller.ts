import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiExcludeController()
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('api/v1/metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getVersionedMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
