import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ChatContextChunkResponse {
  @Expose()
  @ApiProperty({ example: 10 })
  id!: number;

  @Expose()
  @ApiProperty({
    example:
      'pgvector extends PostgreSQL with vector similarity search support.',
  })
  content!: string;

  @Expose()
  @ApiPropertyOptional({
    example: { source: 'manual.pdf', chunkIndex: 0 },
  })
  metadata!: Record<string, unknown> | null;

  @Expose()
  @ApiProperty({ example: 0.142 })
  distance!: number;
}
