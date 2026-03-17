import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchResultResponse {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({
    example:
      'Omnichannel requests can use RAG when contextual retrieval is required.',
  })
  content!: string;

  @ApiPropertyOptional({
    example: { source: 'playbook.pdf', chunkIndex: 2 },
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ example: 0.084 })
  distance!: number;

  @ApiPropertyOptional({ example: 'playbook.pdf' })
  source?: string | null;

  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  createdAt?: string | null;
}
