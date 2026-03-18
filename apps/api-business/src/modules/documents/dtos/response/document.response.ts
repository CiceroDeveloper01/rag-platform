import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DocumentResponse {
  @Expose()
  @ApiProperty({ example: 1 })
  id!: number;

  @Expose()
  @ApiPropertyOptional({ example: 42, nullable: true })
  sourceId!: number | null;

  @Expose()
  @ApiProperty({
    example: 'pgvector extends PostgreSQL with vector similarity search.',
  })
  content!: string;

  @Expose()
  @ApiPropertyOptional({
    example: { source: 'manual.pdf', chunkIndex: 0 },
    nullable: true,
  })
  metadata!: Record<string, unknown> | null;

  @Expose()
  @ApiProperty({ example: '2026-03-17T10:00:00.000Z' })
  createdAt!: string;
}
