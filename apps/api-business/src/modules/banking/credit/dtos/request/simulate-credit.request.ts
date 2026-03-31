import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class SimulateCreditRequest {
  @ApiProperty({ example: 10000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  requestedAmount!: number;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installmentCount!: number;
}
