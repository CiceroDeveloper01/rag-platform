import { env } from "@/src/lib/constants/app";
import { ApiClientError, type ApiErrorPayload } from "@/src/types/api";

function buildUrl(path: string) {
  return `${env.apiBaseUrl.replace(/\/$/, "")}${path}`;
}

async function parseError(response: Response): Promise<never> {
  let payload: ApiErrorPayload | undefined;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = undefined;
  }

  const message = Array.isArray(payload?.message)
    ? payload.message.join(", ")
    : (payload?.message ?? `Request failed with status ${response.status}`);

  throw new ApiClientError(message, response.status, payload);
}

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return parseError(response);
  }

  return (await response.json()) as TResponse;
}

export async function optionalApiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse | null> {
  try {
    return await apiRequest<TResponse>(path, init);
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

function parseSseChunk(chunk: string) {
  return chunk
    .split("\n\n")
    .map((eventBlock) => eventBlock.trim())
    .filter(Boolean)
    .map((eventBlock) => {
      const lines = eventBlock.split("\n");
      const eventName =
        lines
          .find((line) => line.startsWith("event:"))
          ?.replace("event:", "")
          .trim() ?? "message";
      const data = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace("data:", "").trim())
        .join("\n");

      return {
        event: eventName,
        data,
      };
    });
}

export async function streamSse<TData = unknown>({
  path,
  init,
  signal,
  onEvent,
  onJsonFallback,
}: {
  path: string;
  init?: RequestInit;
  signal?: AbortSignal;
  onEvent: (event: { event: string; data: TData }) => void;
  onJsonFallback?: (payload: {
    response: Response;
    payload: unknown;
  }) => void | Promise<void>;
}): Promise<void> {
  const response = await fetch(buildUrl(path), {
    ...init,
    signal,
    credentials: "include",
    headers: {
      Accept: "text/event-stream, application/json",
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return parseError(response);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    const payload = (await response.json()) as unknown;
    await onJsonFallback?.({
      response,
      payload,
    });
    return;
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Streaming is not available in this environment.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const parsedEvent of chunks.flatMap(parseSseChunk)) {
      let eventData: TData;

      try {
        eventData = JSON.parse(parsedEvent.data) as TData;
      } catch {
        eventData = parsedEvent.data as TData;
      }

      onEvent({
        event: parsedEvent.event,
        data: eventData,
      });
    }
  }

  if (buffer.trim()) {
    for (const parsedEvent of parseSseChunk(buffer)) {
      let eventData: TData;

      try {
        eventData = JSON.parse(parsedEvent.data) as TData;
      } catch {
        eventData = parsedEvent.data as TData;
      }

      onEvent({
        event: parsedEvent.event,
        data: eventData,
      });
    }
  }
}

export function getPublicApiBaseUrl() {
  return env.apiBaseUrl;
}
