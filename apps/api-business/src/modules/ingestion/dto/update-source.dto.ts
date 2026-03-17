import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
}
