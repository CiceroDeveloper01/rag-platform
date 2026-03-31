import { ApiProperty } from '@nestjs/swagger';

export class InvestmentSimulationResponse {
  @ApiProperty({ example: 5000 })
  investedAmount!: number;

  @ApiProperty({ example: 'cdb' })
  productType!: string;

  @ApiProperty({ example: 5590 })
  projectedAmount!: number;

  @ApiProperty({ example: 0.118 })
  annualRate!: number;

  @ApiProperty({ example: 365 })
  periodInDays!: number;
}
