import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CompletedChunkDto {
  @IsString()
  content!: string;

  @IsArray()
  @ArrayMinSize(1)
  embedding!: number[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CompleteDocumentIngestionDto {
  @IsInt()
  sourceId!: number;

  @IsString()
  tenantId!: string;

  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedChunkDto)
  chunks!: CompletedChunkDto[];
}
