import type {
  ChannelType,
  ConnectorHealthStatus,
  DateTimeValue,
} from "@rag-platform/types";

export interface ConnectorListItemResponse {
  id: number;
  channel: ChannelType;
  name: string;
  isEnabled: boolean;
  healthStatus: ConnectorHealthStatus;
  lastHealthCheckAt: DateTimeValue | null;
}
