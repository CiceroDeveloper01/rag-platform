export interface SourceSummary {
  id: number;
  filename: string;
  type: string | null;
  uploadedAt: Date;
  chunksCount: number;
}
