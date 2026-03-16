import { ConnectorHealthStatus } from '../enums/connector-health-status.enum';
import { MessageChannel } from '../enums/message-channel.enum';

export interface OmnichannelConnectorProps {
  id?: number;
  channel: MessageChannel;
  name: string;
  isEnabled: boolean;
  healthStatus: ConnectorHealthStatus;
  lastHealthCheckAt?: Date | null;
  configSnapshot?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class OmnichannelConnector {
  constructor(private readonly props: OmnichannelConnectorProps) {}

  toObject(): OmnichannelConnectorProps {
    return { ...this.props };
  }
}
