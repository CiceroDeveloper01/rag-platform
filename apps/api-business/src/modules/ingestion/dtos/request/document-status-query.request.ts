import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class DocumentStatusQueryRequest {
  @ApiPropertyOptional({ example: 25, default: 25 })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumberString()
  offset?: number;

  @ApiPropertyOptional({ example: 'handbook' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
