export interface Tracer {
  runInSpan<T>(name: string, operation: () => Promise<T>): Promise<T>;
}
