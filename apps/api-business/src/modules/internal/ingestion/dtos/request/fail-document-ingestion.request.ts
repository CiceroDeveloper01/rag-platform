import { IsInt, IsOptional, IsString } from 'class-validator';

export class FailDocumentIngestionRequest {
  @IsInt()
  sourceId!: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsInt()
  @IsOptional()
  retryCount?: number;
}
