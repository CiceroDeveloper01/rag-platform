import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CreateHandoffDto } from './create-handoff.dto';

@Injectable()
export class InternalHandoffService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(InternalHandoffService.name);
  }

  async createHandoff(dto: CreateHandoffDto) {
    this.logger.warn(
      {
        channel: dto.channel,
        externalMessageId: dto.externalMessageId,
        reason: dto.reason,
      },
      'Internal handoff request accepted',
    );

    return {
      success: true as const,
      handoffId: dto.externalMessageId,
    };
  }
}
