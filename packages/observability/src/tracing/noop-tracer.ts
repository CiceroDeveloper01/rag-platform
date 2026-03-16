import { Tracer } from "./tracer";

export class NoopTracer implements Tracer {
  async runInSpan<T>(_name: string, operation: () => Promise<T>): Promise<T> {
    return operation();
  }
}
