import { ApiProperty } from '@nestjs/swagger';

export class InvestmentPositionResponse {
  @ApiProperty({ example: 'prod-cdb-001' })
  productId!: string;

  @ApiProperty({ example: 'CDB Liquidez Diaria' })
  productName!: string;

  @ApiProperty({ example: 15000 })
  investedAmount!: number;
}

export class InvestmentPortfolioResponse {
  @ApiProperty({ example: 'cust-001' })
  customerId!: string;

  @ApiProperty({ type: InvestmentPositionResponse, isArray: true })
  positions!: InvestmentPositionResponse[];

  @ApiProperty({ example: 22500 })
  totalInvestedAmount!: number;
}
