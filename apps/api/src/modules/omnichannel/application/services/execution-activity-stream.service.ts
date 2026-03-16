import { Injectable } from '@nestjs/common';
import type { ExecutionStreamEventResponse } from '@rag-platform/contracts';
import { Observable, ReplaySubject } from 'rxjs';
import { FeatureFlagsService } from '../../../../common/feature-flags/feature-flags.service';
import { ObservabilityMetricsService } from '../../../../common/observability/services/metrics.service';

@Injectable()
export class ExecutionActivityStreamService {
  private readonly maxBufferedEvents = 100;
  private activeSubscribers = 0;
  private readonly subject = new ReplaySubject<ExecutionStreamEventResponse>(
    this.maxBufferedEvents,
  );

  constructor(
    private readonly observabilityMetricsService: ObservabilityMetricsService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {
    this.updateSubscriberGauge();
  }

  publish(event: ExecutionStreamEventResponse): void {
    if (!this.featureFlagsService.isLiveActivityEnabled()) {
      return;
    }

    this.observabilityMetricsService.incrementCounter(
      'live_activity_events_total',
      { type: event.type },
      1,
      'Total number of live activity events published to the SSE stream',
    );
    this.subject.next(event);
  }

  stream(): Observable<ExecutionStreamEventResponse> {
    if (!this.featureFlagsService.isLiveActivityEnabled()) {
      this.featureFlagsService.recordDisabledHit('live_activity', {
        operation: 'sse_stream',
      });

      return new Observable<ExecutionStreamEventResponse>((subscriber) => {
        subscriber.complete();
      });
    }

    return new Observable<ExecutionStreamEventResponse>((subscriber) => {
      this.activeSubscribers += 1;
      this.observabilityMetricsService.incrementCounter(
        'live_activity_stream_connections_total',
        {},
        1,
        'Total number of SSE live activity stream client connections',
      );
      this.updateSubscriberGauge();

      const subscription = this.subject.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        this.activeSubscribers = Math.max(0, this.activeSubscribers - 1);
        this.observabilityMetricsService.incrementCounter(
          'live_activity_stream_disconnects_total',
          {},
          1,
          'Total number of SSE live activity stream client disconnects',
        );
        this.updateSubscriberGauge();
      };
    });
  }

  private updateSubscriberGauge(): void {
    this.observabilityMetricsService.setGauge(
      'live_activity_stream_subscribers',
      this.activeSubscribers,
      {},
      'Current number of active SSE live activity subscribers',
    );
  }
}
