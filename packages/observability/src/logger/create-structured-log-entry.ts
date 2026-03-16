import { StructuredLogEntry } from "./structured-log-entry";

export function createStructuredLogEntry(
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
): StructuredLogEntry {
  return {
    scope,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
