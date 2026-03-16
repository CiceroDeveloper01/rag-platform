"use client";

import { useCallback } from "react";
import type {
  Connector,
  OmnichannelConnectorFilters,
} from "@/src/types/omnichannel";
import { omnichannelService } from "../services/omnichannel.service";
import { useRefreshableQuery } from "./use-refreshable-query";

export function useOmnichannelConnectors(
  filters: OmnichannelConnectorFilters = {},
  options?: { refreshIntervalMs?: number },
) {
  const loader = useCallback(async () => {
    return omnichannelService.listConnectors(filters);
  }, [filters]);

  const query = useRefreshableQuery<Connector[]>({
    loader,
    refreshIntervalMs: options?.refreshIntervalMs,
  });

  const toggleConnector = useCallback(
    async (id: number, enabled?: boolean) => {
      await omnichannelService.toggleConnector(id, enabled);
      await query.refetch();
    },
    [query],
  );

  return {
    ...query,
    toggleConnector,
  };
}
