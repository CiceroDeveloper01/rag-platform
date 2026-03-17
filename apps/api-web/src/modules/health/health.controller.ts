import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller(['health', 'api/v1/health'])
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Returns application and database readiness information.',
  })
  @ApiOkResponse({
    description: 'Basic application health status.',
    schema: {
      example: {
        status: 'ok',
        uptime: 124.65,
        timestamp: '2026-03-13T13:10:00.000Z',
        version: '0.0.1',
        database: 'up',
      },
    },
  })
  check() {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Returns process liveness information.' })
  @ApiOkResponse({ description: 'Liveness result returned successfully.' })
  checkLive() {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Returns aggregated readiness information.' })
  @ApiOkResponse({ description: 'Readiness result returned successfully.' })
  checkReady() {
    return this.healthService.checkReadiness();
  }

  @Get('db')
  @ApiOperation({ summary: 'Checks PostgreSQL availability.' })
  @ApiOkResponse({
    description: 'Database health result returned successfully.',
  })
  checkDb() {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({
    summary: 'Checks Redis availability used by the cache layer.',
  })
  @ApiOkResponse({ description: 'Redis health result returned successfully.' })
  checkRedis() {
    return this.healthService.checkRedis();
  }

  @Get('storage')
  @ApiOperation({ summary: 'Checks the configured document storage provider.' })
  @ApiOkResponse({
    description: 'Storage health result returned successfully.',
  })
  checkStorage() {
    return this.healthService.checkStorage();
  }

  @Get('rag')
  @ApiOperation({
    summary:
      'Checks RAG retrieval readiness without invoking a full chat completion.',
  })
  @ApiOkResponse({ description: 'RAG health result returned successfully.' })
  checkRag() {
    return this.healthService.checkRag();
  }

  @Get('email')
  @ApiOperation({
    summary:
      'Checks the configured email provider used by the omnichannel stack.',
  })
  @ApiOkResponse({
    description: 'Email provider health result returned successfully.',
  })
  checkEmail() {
    return this.healthService.checkEmail();
  }
}
