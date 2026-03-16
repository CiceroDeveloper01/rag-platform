import { MessageChannel } from '../enums/message-channel.enum';
import { OmnichannelConnector } from '../entities/omnichannel-connector.entity';

export interface IConnectorRepository {
  ensureDefaults(
    connectors: Array<{ channel: MessageChannel; name: string }>,
  ): Promise<void>;
  findMany(): Promise<OmnichannelConnector[]>;
  findById(connectorId: number): Promise<OmnichannelConnector | null>;
  updateEnabled(
    connectorId: number,
    isEnabled: boolean,
  ): Promise<OmnichannelConnector | null>;
}

export const OMNICHANNEL_CONNECTOR_REPOSITORY = Symbol(
  'OMNICHANNEL_CONNECTOR_REPOSITORY',
);
