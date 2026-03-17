import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AppCacheService } from '../../../../common/cache/services/app-cache.service';
import { ToggleConnectorDto } from '../dto/toggle-connector.dto';
import { OMNICHANNEL_CONNECTOR_REPOSITORY } from '../../domain/repositories/connector-repository.interface';
import type { IConnectorRepository } from '../../domain/repositories/connector-repository.interface';

@Injectable()
export class OmnichannelConnectorService {
  constructor(
    @Inject(OMNICHANNEL_CONNECTOR_REPOSITORY)
    private readonly connectorRepository: IConnectorRepository,
    private readonly appCacheService: AppCacheService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OmnichannelConnectorService.name);
  }

  async toggle(connectorId: number, dto: ToggleConnectorDto) {
    const current = await this.connectorRepository.findById(connectorId);

    if (!current) {
      throw new NotFoundException('Omnichannel connector not found');
    }

    const currentState = current.toObject().isEnabled;
    const nextState = dto.enabled ?? !currentState;
    const updated = await this.connectorRepository.updateEnabled(
      connectorId,
      nextState,
    );

    if (!updated) {
      throw new NotFoundException('Omnichannel connector not found');
    }

    this.logger.info({
      connectorId,
      channel: updated.toObject().channel,
      previousState: currentState,
      nextState,
    });

    await this.appCacheService.invalidateByPrefix('dashboard:connectors');
    await this.appCacheService.invalidateByPrefix('dashboard:overview');

    return updated.toObject();
  }
}
