import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class RegisterDocumentRequest {
  @ApiProperty({ example: 'tenant-acme' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ example: 'telegram' })
  @IsString()
  source!: string;

  @ApiProperty({ example: 'Customer sent a PDF about billing policy.' })
  @IsString()
  content!: string;

  @ApiProperty({ example: 'telegram:123456' })
  @IsString()
  externalMessageId!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
