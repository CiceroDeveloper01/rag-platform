import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSourceDto {
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
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    example: 'COMPLETED',
  })
  @IsOptional()
  @IsIn(['PENDING', 'COMPLETED', 'FAILED'])
  ingestionStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional({ example: 'embedding_generation_failed' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ingestionFailureReason?: string;
}
