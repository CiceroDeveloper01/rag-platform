type WorkerEventCallback<T> = (job?: Job<T>, error?: Error) => void;

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

export type Job<T> = {
  id?: string | number;
  name: string;
  data: T;
  attemptsMade?: number;
  opts: JobsOptions;
};

export class Queue<T> {
  public readonly jobs: Array<{
    name: string;
    data: T;
    options?: JobsOptions;
  }> = [];

  constructor(
    public readonly name: string,
    public readonly options?: Record<string, unknown>,
  ) {}

  async add(name: string, data: T, options?: JobsOptions): Promise<void> {
    this.jobs.push({ name, data, options });
  }

  async close(): Promise<void> {
    return;
  }
}

export class Worker<T> {
  private readonly listeners = new Map<string, WorkerEventCallback<T>>();

  constructor(
    public readonly queueName: string,
    public readonly handler: (job: Job<T>) => Promise<void>,
    public readonly options?: Record<string, unknown>,
  ) {}

  on(event: string, callback: WorkerEventCallback<T>): this {
    this.listeners.set(event, callback);
    return this;
  }

  async close(): Promise<void> {
    return;
  }
}
