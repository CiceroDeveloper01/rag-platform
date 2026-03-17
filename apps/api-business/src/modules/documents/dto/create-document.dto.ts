import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiPropertyOptional({
    example: 'tenant-acme',
    description:
      'Explicit tenant scope for manual or internal document persistence.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;

  @ApiProperty({
    example: 'pgvector extends PostgreSQL with vector similarity search.',
    description: 'Document content or chunk content to persist.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content!: string;

  @ApiPropertyOptional({
    example: { source: 'manual.pdf', chunkIndex: 0, totalChunks: 12 },
    description: 'Arbitrary metadata attached to the stored document.',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
