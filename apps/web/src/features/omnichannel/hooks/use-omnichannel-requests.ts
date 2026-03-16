"use client";

import { useCallback } from "react";
import type {
  OmnichannelRequestFilters,
  OmnichannelRequestsResponse,
} from "@/src/types/omnichannel";
import { omnichannelService } from "../services/omnichannel.service";
import { useRefreshableQuery } from "./use-refreshable-query";

export function useOmnichannelRequests(
  filters: OmnichannelRequestFilters,
  options?: { refreshIntervalMs?: number },
) {
  const loader = useCallback(async () => {
    return omnichannelService.listRequests(filters);
  }, [filters]);

  return useRefreshableQuery<OmnichannelRequestsResponse>({
    loader,
    refreshIntervalMs: options?.refreshIntervalMs,
  });
}
