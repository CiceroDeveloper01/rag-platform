import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateInvestmentOrderRequest {
  @ApiProperty({ example: 'prod-cdb-001' })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 5000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;
}
