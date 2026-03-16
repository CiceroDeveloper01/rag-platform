"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useRefreshableQuery<T>({
  loader,
  refreshIntervalMs,
}: {
  loader: () => Promise<T>;
  refreshIntervalMs?: number;
}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  const refetch = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;

      if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await loader();
        setData(response);
        setError(null);
      } catch (requestError) {
        console.error("[omnichannel] query failed", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar os dados do omnichannel.",
        );
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [loader],
  );

  useEffect(() => {
    void refetch("initial");
  }, [refetch]);

  useEffect(() => {
    if (!refreshIntervalMs) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void refetch("refresh");
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [refetch, refreshIntervalMs]);

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    refetch,
  };
}
