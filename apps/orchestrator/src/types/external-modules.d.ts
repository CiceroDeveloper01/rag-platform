declare module "bullmq" {
  export type JobsOptions = {
    attempts?: number;
    backoff?: {
      type: string;
      delay: number;
    };
    removeOnComplete?: unknown;
    removeOnFail?: unknown;
    jobId?: string;
  };

  export interface Job<T = unknown> {
    id?: string | number;
    name: string;
    data: T;
    attemptsMade: number;
    opts: JobsOptions;
  }

  export class Queue<T = unknown> {
    constructor(name: string, options?: Record<string, unknown>);
    add(name: string, data: T, options?: JobsOptions): Promise<void>;
    close(): Promise<void>;
  }

  export class Worker<T = unknown> {
    constructor(
      queueName: string,
      handler: (job: Job<T>) => Promise<void>,
      options?: Record<string, unknown>,
    );
    on(
      event: string,
      callback: (job?: Job<T>, error?: Error) => void,
    ): this;
    close(): Promise<void>;
  }
}

declare module "@langchain/langgraph" {
  export const START: string;
  export const END: string;

  export type AnnotationConfig<T> = {
    reducer?: (previous: T, next: T) => T;
    default?: () => T;
  };

  export interface AnnotationRootDefinition {
    State: unknown;
    shape: Record<string, AnnotationConfig<unknown>>;
  }

  export interface AnnotationFactory {
    <T>(config?: AnnotationConfig<T>): AnnotationConfig<T>;
    Root<T extends Record<string, AnnotationConfig<unknown>>>(
      shape: T,
    ): AnnotationRootDefinition;
  }

  export const Annotation: AnnotationFactory;

  export class StateGraph<TState = unknown> {
    constructor(state: TState);
    addNode(
      name: string,
      handler: (state: any) => Promise<Record<string, unknown>>,
    ): this;
    addEdge(from: string, to: string): this;
    addConditionalEdges(
      from: string,
      resolver: (state: any) => string,
      routes: Record<string, string>,
    ): this;
    compile(): {
      invoke(input: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
  }
}
