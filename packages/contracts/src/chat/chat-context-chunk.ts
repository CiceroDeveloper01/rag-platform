export interface ChatContextChunk {
  id: number;
  content: string;
  metadata: Record<string, unknown> | null;
  distance: number;
  source?: string | null;
  createdAt?: string | null;
}
