export interface SourceRecord {
  id: number;
  filename: string;
  uploadedAt: Date;
  type: string | null;
  storageKey?: string | null;
  storageUrl?: string | null;
  chunksCount?: number;
}
