export interface StructuredLogEntry {
  scope: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
