import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class SimulateInvestmentRequest {
  @ApiProperty({ example: 'cdb' })
  @IsString()
  productType!: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 365 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  periodInDays!: number;
}
