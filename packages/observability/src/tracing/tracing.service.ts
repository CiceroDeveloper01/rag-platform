import { Injectable } from "@nestjs/common";

export interface TracingSpan {
  name: string;
  startedAt: string;
  endedAt?: string;
}

@Injectable()
export class TracingService {
  startSpan(name: string): TracingSpan {
    return {
      name,
      startedAt: new Date().toISOString(),
    };
  }

  endSpan(span: TracingSpan): TracingSpan {
    return {
      ...span,
      endedAt: new Date().toISOString(),
    };
  }
}
