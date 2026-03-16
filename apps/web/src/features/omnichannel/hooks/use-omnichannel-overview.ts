"use client";

import { useCallback, useMemo } from "react";
import type {
  ChannelMetrics,
  LatencyMetrics,
  OmnichannelMetricPeriodFilters,
  OmnichannelOverview,
  OmnichannelRequest,
  RagUsageMetrics,
} from "@/src/types/omnichannel";
import { omnichannelService } from "../services/omnichannel.service";
import { useRefreshableQuery } from "./use-refreshable-query";

export interface OmnichannelOverviewData {
  overview: OmnichannelOverview;
  channelMetrics: ChannelMetrics[];
  latencyMetrics: LatencyMetrics[];
  ragUsage: RagUsageMetrics;
  recentRequests: OmnichannelRequest[];
}

export function useOmnichannelOverview(
  filters: OmnichannelMetricPeriodFilters = {},
  options?: { refreshIntervalMs?: number },
) {
  const filtersKey = JSON.stringify(filters ?? {});
  const normalizedFilters = useMemo(
    () => JSON.parse(filtersKey) as OmnichannelMetricPeriodFilters,
    [filtersKey],
  );

  const loader = useCallback(async () => {
    const [overview, channelMetrics, latencyMetrics, ragUsage, recentRequests] =
      await Promise.all([
        omnichannelService.getOverview(normalizedFilters),
        omnichannelService.getChannelMetrics(normalizedFilters),
        omnichannelService.getLatencyMetrics(normalizedFilters),
        omnichannelService.getRagUsage(normalizedFilters),
        omnichannelService.listRequests({
          limit: 10,
          offset: 0,
          sortOrder: "desc",
          ...normalizedFilters,
        }),
      ]);

    return {
      overview,
      channelMetrics,
      latencyMetrics,
      ragUsage,
      recentRequests: recentRequests.items,
    } satisfies OmnichannelOverviewData;
  }, [normalizedFilters]);

  return useRefreshableQuery({
    loader,
    refreshIntervalMs: options?.refreshIntervalMs,
  });
}
