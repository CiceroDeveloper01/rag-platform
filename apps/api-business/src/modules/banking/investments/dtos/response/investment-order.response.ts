import { ApiProperty } from '@nestjs/swagger';

export class InvestmentOrderResponse {
  @ApiProperty({ example: 'ord-001' })
  orderId!: string;

  @ApiProperty({ example: 'prod-cdb-001' })
  productId!: string;

  @ApiProperty({ example: 5000 })
  amount!: number;

  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ example: 'Investment order accepted successfully.' })
  message!: string;
}
