"use client";

import { useEffect, useRef, useState } from "react";
import type { ExecutionStreamEvent } from "@/src/types/omnichannel";
import { omnichannelService } from "../services/omnichannel.service";

export function useLiveActivity(options?: { maxItems?: number }) {
  const maxItems = options?.maxItems ?? 100;
  const [events, setEvents] = useState<ExecutionStreamEvent[]>([]);
  const [status, setStatus] = useState<
    "connecting" | "live" | "reconnecting" | "disconnected"
  >("connecting");
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    hasConnectedRef.current = false;

    const source = omnichannelService.connectExecutionStream({
      onEvent: (event) => {
        hasConnectedRef.current = true;
        setStatus("live");
        setEvents((current) => {
          const next = [event, ...current];
          return next.slice(0, maxItems);
        });
      },
      onError: (eventSource) => {
        if (eventSource.readyState === EventSource.CLOSED) {
          setStatus("disconnected");
          return;
        }

        setStatus(hasConnectedRef.current ? "reconnecting" : "connecting");
      },
    });

    return () => {
      source.close();
    };
  }, [maxItems]);

  return {
    events,
    status,
  };
}
