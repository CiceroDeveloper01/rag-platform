import type { ObservabilityService } from './observability.service';

export class ObservabilityAccessor {
  private static service: ObservabilityService | null = null;

  static set(service: ObservabilityService): void {
    this.service = service;
  }

  static get(): ObservabilityService | null {
    return this.service;
  }
}
