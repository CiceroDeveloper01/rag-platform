"use client";

import { useCallback } from "react";
import type { OmnichannelRequestDetails } from "@/src/types/omnichannel";
import { omnichannelService } from "../services/omnichannel.service";
import { useRefreshableQuery } from "./use-refreshable-query";

export function useOmnichannelRequestDetails(
  requestId: number,
  options?: { refreshIntervalMs?: number },
) {
  const loader = useCallback(async () => {
    return omnichannelService.getRequestDetails(requestId);
  }, [requestId]);

  return useRefreshableQuery<OmnichannelRequestDetails>({
    loader,
    refreshIntervalMs: options?.refreshIntervalMs,
  });
}
