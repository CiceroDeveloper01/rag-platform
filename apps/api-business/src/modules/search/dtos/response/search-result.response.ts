import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SearchResultResponse {
  @Expose()
  @ApiProperty({ example: 10 })
  id!: number;

  @Expose()
  @ApiProperty({
    example:
      'Omnichannel requests can use RAG when contextual retrieval is required.',
  })
  content!: string;

  @Expose()
  @ApiPropertyOptional({
    example: { source: 'playbook.pdf', chunkIndex: 2 },
  })
  metadata!: Record<string, unknown> | null;

  @Expose()
  @ApiProperty({ example: 0.084 })
  distance!: number;

  @Expose()
  @ApiPropertyOptional({ example: 'playbook.pdf' })
  source?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  createdAt?: string | null;
}
