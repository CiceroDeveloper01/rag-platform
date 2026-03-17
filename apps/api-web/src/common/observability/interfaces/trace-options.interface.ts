export interface TraceOptions {
  name?: string;
  includeArgs?: boolean;
  includeResult?: boolean;
  attributes?: Record<string, string | number | boolean>;
}
