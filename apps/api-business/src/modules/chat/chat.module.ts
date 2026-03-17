import { Module } from '@nestjs/common';
import { ChatApplicationModule } from './application/chat-application.module';
import { ChatController } from './controllers/chat.controller';
import { ChatInfrastructureModule } from './infrastructure/chat-infrastructure.module';

@Module({
  imports: [ChatApplicationModule, ChatInfrastructureModule],
  controllers: [ChatController],
  exports: [ChatApplicationModule, ChatInfrastructureModule],
})
export class ChatModule {}
