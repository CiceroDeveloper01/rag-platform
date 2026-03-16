import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'tenant-acme' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    example: 'Updated content for the document chunk.',
    description: 'New content persisted for the selected document.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(12000)
  content?: string;

  @ApiPropertyOptional({
    example: { source: 'updated-manual.pdf', reviewed: true },
    description: 'Metadata patch applied to the document.',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
