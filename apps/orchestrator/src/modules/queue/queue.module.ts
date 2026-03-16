import { Module } from "@nestjs/common";
import { DeadLetterQueueService } from "./dead-letter.queue";
import { FlowExecutionQueueService } from "./flow-execution.queue";
import { InboundMessagesQueueService } from "./inbound-messages.queue";

@Module({
  providers: [
    InboundMessagesQueueService,
    FlowExecutionQueueService,
    DeadLetterQueueService,
  ],
  exports: [
    InboundMessagesQueueService,
    FlowExecutionQueueService,
    DeadLetterQueueService,
  ],
})
export class QueueModule {}
