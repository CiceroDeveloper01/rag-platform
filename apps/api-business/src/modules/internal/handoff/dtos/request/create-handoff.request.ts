import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateHandoffRequest {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  channel!: string;

  @ApiProperty({ example: 'whatsapp:message-991' })
  @IsString()
  externalMessageId!: string;

  @ApiProperty({ example: 'Customer requested a human agent.' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
