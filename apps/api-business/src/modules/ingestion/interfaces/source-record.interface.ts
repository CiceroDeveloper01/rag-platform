import { SourceIngestionStatus } from "./source-status.type";

export interface SourceRecord {
  id: number;
  filename: string;
  uploadedAt: Date;
  type: string | null;
  ingestionStatus: SourceIngestionStatus;
  ingestionFailureReason?: string | null;
  storageKey?: string | null;
  storageUrl?: string | null;
  chunksCount?: number;
}
