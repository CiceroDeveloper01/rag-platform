import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class ReplyConversationDto {
  @ApiProperty({ example: 'tenant-acme' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ example: 'email' })
  @IsString()
  channel!: string;

  @ApiProperty({ example: 'email:message-42' })
  @IsString()
  externalMessageId!: string;

  @ApiProperty({ example: 'We received your request and are processing it.' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
