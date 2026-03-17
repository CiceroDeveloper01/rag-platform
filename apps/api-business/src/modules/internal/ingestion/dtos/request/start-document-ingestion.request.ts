import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class StartDocumentIngestionRequest {
  @ApiProperty({ example: 42 })
  @IsInt()
  sourceId!: number;

  @ApiProperty({ example: '8de7b396-7f0f-4187-b53d-4789ed0f3cb7' })
  @IsString()
  eventId!: string;

  @ApiProperty({ example: 'ec6a28f1-0be9-4db5-8758-877ba6e0f07f' })
  @IsString()
  correlationId!: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  retryCount!: number;
}
