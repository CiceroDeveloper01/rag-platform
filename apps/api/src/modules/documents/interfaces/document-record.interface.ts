export interface DocumentRecord {
  id: number;
  tenantId: string;
  sourceId: number | null;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
