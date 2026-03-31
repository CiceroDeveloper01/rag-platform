import { ApiProperty } from '@nestjs/swagger';

export class InvestmentProductResponse {
  @ApiProperty({ example: 'prod-cdb-001' })
  id!: string;

  @ApiProperty({ example: 'CDB Liquidez Diaria' })
  name!: string;

  @ApiProperty({ example: 'cdb' })
  type!: string;

  @ApiProperty({ example: 1000 })
  minimumAmount!: number;

  @ApiProperty({ example: 0.118 })
  annualRate!: number;

  @ApiProperty({ example: 'D+0' })
  liquidity!: string;

  @ApiProperty({ example: 365 })
  maturityDays!: number;
}
