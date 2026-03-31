export interface ToolInput {
  userId: string;
  tenantId?: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tool {
  name: string;
  execute(input: ToolInput): Promise<ToolResult>;
}
