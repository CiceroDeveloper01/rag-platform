import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageChannel } from '../../../domain/enums/message-channel.enum';

export class ProcessOmnichannelMessageRequest {
  @ApiPropertyOptional({
    example: 'telegram-msg-987',
    description: 'Original provider message identifier.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalMessageId?: string;

  @ApiPropertyOptional({
    example: 'chat-12345',
    description: 'Conversation identifier provided by the source channel.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  conversationId?: string;

  @ApiProperty({
    enum: MessageChannel,
    example: MessageChannel.TELEGRAM,
    description: 'Inbound source channel.',
  })
  @IsEnum(MessageChannel)
  channel!: MessageChannel;

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  senderId?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  senderName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  senderAddress?: string;

  @ApiPropertyOptional({ example: 'support@rag-platform.local' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipientAddress?: string;

  @ApiPropertyOptional({ example: 'Question about deployment' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({
    example: 'Where can I find the deployment runbook?',
    description: 'Normalized inbound message body.',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({
    example: { chatId: 123456789, username: 'rag_user' },
    description:
      'Channel-specific metadata preserved for diagnostics and analytics.',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
