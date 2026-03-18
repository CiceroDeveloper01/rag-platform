import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TelegramFromRequest {
  @ApiProperty({ example: 123456789 })
  @IsInt()
  id!: number;

  @ApiPropertyOptional({ example: 'rag_user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;
}

class TelegramChatRequest {
  @ApiProperty({ example: 987654321 })
  @IsInt()
  id!: number;

  @ApiProperty({ example: 'private' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'Support Group' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'rag_support' })
  @IsOptional()
  @IsString()
  username?: string;
}

class TelegramMessageRequest {
  @ApiProperty({ example: 101 })
  @IsInt()
  message_id!: number;

  @ApiProperty({ example: 1731316534 })
  @IsInt()
  date!: number;

  @ApiProperty({ type: () => TelegramChatRequest })
  @ValidateNested()
  @Type(() => TelegramChatRequest)
  chat!: TelegramChatRequest;

  @ApiPropertyOptional({ type: () => TelegramFromRequest })
  @IsOptional()
  @ValidateNested()
  @Type(() => TelegramFromRequest)
  from?: TelegramFromRequest;

  @ApiProperty({
    example: 'How does the omnichannel orchestrator decide when to use RAG?',
  })
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class TelegramWebhookRequest {
  @ApiProperty({ example: 555444333 })
  @IsInt()
  update_id!: number;

  @ApiProperty({ type: () => TelegramMessageRequest })
  @ValidateNested()
  @Type(() => TelegramMessageRequest)
  message!: TelegramMessageRequest;

  @ApiPropertyOptional({ example: { source: 'telegram' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
