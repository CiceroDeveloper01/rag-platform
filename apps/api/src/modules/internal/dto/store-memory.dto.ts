import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class StoreMemoryDto {
  @ApiProperty({ example: 'default' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ example: 'telegram' })
  @IsString()
  channel!: string;

  @ApiProperty({ example: 'telegram:chat-123' })
  @IsString()
  conversationId!: string;

  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'system'] })
  @IsIn(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty({ example: 'Where is my invoice?' })
  @IsString()
  message!: string;

  @ApiProperty({ type: [Number], example: [0.1, 0.2, 0.3] })
  @IsArray()
  embedding!: number[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  @IsOptional()
  @IsString()
  createdAt?: string;
}
