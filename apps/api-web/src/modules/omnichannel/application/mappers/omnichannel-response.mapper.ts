import { OmnichannelConnector } from '../../domain/entities/omnichannel-connector.entity';
import { OmnichannelExecution } from '../../domain/entities/omnichannel-execution.entity';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { OmnichannelMetricSnapshot } from '../../domain/entities/omnichannel-metric-snapshot.entity';

export const OmnichannelResponseMapper = {
  toMessageResponse(message: OmnichannelMessage) {
    return message.toObject();
  },

  toExecutionResponse(execution: OmnichannelExecution) {
    return execution.toObject();
  },

  toConnectorResponse(connector: OmnichannelConnector) {
    return connector.toObject();
  },

  toMetricSnapshotResponse(snapshot: OmnichannelMetricSnapshot) {
    return snapshot.toObject();
  },
};
