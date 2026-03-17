import { Module } from '@nestjs/common';
import { AgentTraceGateway } from './agent-trace.gateway';
import { AgentTraceRepository } from './agent-trace.repository';
import { AgentTraceService } from './agent-trace.service';

@Module({
  providers: [AgentTraceRepository, AgentTraceService, AgentTraceGateway],
  exports: [AgentTraceService],
})
export class AgentTraceModule {}
