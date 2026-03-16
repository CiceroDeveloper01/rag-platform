import { apiRequest } from "@/src/lib/api/api-client";
import { getPublicApiBaseUrl } from "@/src/lib/api/api-client";
import type {
  ChannelMetrics,
  Connector,
  ExecutionStreamEvent,
  LatencyMetrics,
  OmnichannelConnectorFilters,
  OmnichannelExecutionsResponse,
  OmnichannelMetricPeriodFilters,
  OmnichannelOverview,
  OmnichannelRequestDetails,
  OmnichannelRequestFilters,
  OmnichannelRequestsResponse,
  RagUsageMetrics,
} from "@/src/types/omnichannel";

function buildQueryString(params: object) {
  const searchParams = new URLSearchParams();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}

export const omnichannelService = {
  getOverview(filters: OmnichannelMetricPeriodFilters = {}) {
    return apiRequest<OmnichannelOverview>(
      `/api/v1/omnichannel/overview${buildQueryString(filters)}`,
    );
  },

  listRequests(filters: OmnichannelRequestFilters = {}) {
    return apiRequest<OmnichannelRequestsResponse>(
      `/api/v1/omnichannel/requests${buildQueryString(filters)}`,
    );
  },

  getRequestDetails(id: number) {
    return apiRequest<OmnichannelRequestDetails>(
      `/api/v1/omnichannel/requests/${String(id)}`,
    );
  },

  listExecutions(filters: OmnichannelRequestFilters = {}) {
    return apiRequest<OmnichannelExecutionsResponse>(
      `/api/v1/omnichannel/executions${buildQueryString(filters)}`,
    );
  },

  getChannelMetrics(filters: OmnichannelMetricPeriodFilters = {}) {
    return apiRequest<ChannelMetrics[]>(
      `/api/v1/omnichannel/metrics/channels${buildQueryString(filters)}`,
    );
  },

  getLatencyMetrics(filters: OmnichannelMetricPeriodFilters = {}) {
    return apiRequest<LatencyMetrics[]>(
      `/api/v1/omnichannel/metrics/latency${buildQueryString(filters)}`,
    );
  },

  getRagUsage(filters: OmnichannelMetricPeriodFilters = {}) {
    return apiRequest<RagUsageMetrics>(
      `/api/v1/omnichannel/metrics/rag-usage${buildQueryString(filters)}`,
    );
  },

  listConnectors(filters: OmnichannelConnectorFilters = {}) {
    return apiRequest<Connector[]>(
      `/api/v1/omnichannel/connectors${buildQueryString(filters)}`,
    );
  },

  toggleConnector(id: number, enabled?: boolean) {
    return apiRequest<Connector>(
      `/api/v1/omnichannel/connectors/${String(id)}/toggle`,
      {
        method: "PATCH",
        body: JSON.stringify(typeof enabled === "boolean" ? { enabled } : {}),
      },
    );
  },

  connectExecutionStream(handlers: {
    onEvent: (event: ExecutionStreamEvent) => void;
    onError?: (source: EventSource) => void;
  }) {
    const source = new EventSource(
      `${getPublicApiBaseUrl().replace(/\/$/, "")}/api/v1/executions/stream`,
      { withCredentials: true },
    );

    const handleIncomingEvent = (event: MessageEvent<string>) => {
      try {
        handlers.onEvent(JSON.parse(event.data) as ExecutionStreamEvent);
      } catch {
        // Ignore malformed SSE events to keep the feed resilient.
      }
    };

    source.onmessage = handleIncomingEvent;
    source.addEventListener("execution", handleIncomingEvent as EventListener);

    source.onerror = () => {
      handlers.onError?.(source);
    };

    return source;
  },
};
