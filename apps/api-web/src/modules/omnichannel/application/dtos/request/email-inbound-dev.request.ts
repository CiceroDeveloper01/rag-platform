import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DevEmailMetadataRequest {
  [key: string]: unknown;
}

export class EmailInboundDevRequest {
  @ApiPropertyOptional({ example: 'Operations Team' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromName?: string;

  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  fromEmail!: string;

  @ApiProperty({ example: 'bot@rag-platform.local' })
  @IsEmail()
  toEmail!: string;

  @ApiPropertyOptional({ example: 'Need the latest onboarding guide' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({
    example:
      'Please send me the latest onboarding guide for the omnichannel platform.',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ example: 'email-dev-1001' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalMessageId?: string;

  @ApiPropertyOptional({ example: 'thread-42' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  conversationId?: string;

  @ApiPropertyOptional({
    example: { provider: 'dev', headers: { 'x-sandbox': 'true' } },
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DevEmailMetadataRequest)
  metadata?: Record<string, unknown>;
}
