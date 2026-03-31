import { ApiProperty } from '@nestjs/swagger';

export class CustomerSummaryResponse {
  @ApiProperty({ example: 'cust-001' })
  id!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  fullName!: string;

  @ApiProperty({ example: 4 })
  activeProducts!: number;

  @ApiProperty({ example: 2 })
  totalAccounts!: number;

  @ApiProperty({ example: true })
  hasCreditCard!: boolean;

  @ApiProperty({ example: true })
  hasInvestments!: boolean;
}
