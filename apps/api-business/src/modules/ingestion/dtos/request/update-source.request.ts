import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSourceRequest {
  @ApiPropertyOptional({ example: 'updated-manual.pdf' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  filename?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  @IsOptional()
  @IsIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
  ingestionStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional({
    enum: ['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXING'],
    example: 'PARSING',
  })
  @IsOptional()
  @IsIn(['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXING'])
  ingestionCurrentStep?: 'PARSING' | 'CHUNKING' | 'EMBEDDING' | 'INDEXING';

  @ApiPropertyOptional({ example: 'embedding_generation_failed' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ingestionFailureReason?: string;
}
