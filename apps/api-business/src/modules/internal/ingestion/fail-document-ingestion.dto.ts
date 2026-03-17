import { IsInt, IsOptional, IsString } from 'class-validator';

export class FailDocumentIngestionDto {
  @IsInt()
  sourceId!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
