import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    example: 500,
    minimum: 100,
    maximum: 2000,
    description: 'Approximate chunk size used during ingestion chunking.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(2000)
  chunkSize?: number;

  @ApiPropertyOptional({
    example: 50,
    minimum: 0,
    maximum: 500,
    description:
      'Number of overlapping units preserved between adjacent chunks.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(500)
  chunkOverlap?: number;

  @ApiPropertyOptional({
    example: '{"category":"handbook","source":"demo"}',
    description:
      'Optional JSON metadata string persisted alongside generated document chunks.',
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}
