import { ApiProperty } from '@nestjs/swagger';

export class CreditContractResponse {
  @ApiProperty({ example: 'ctr-001' })
  contractId!: string;

  @ApiProperty({ example: 'Personal Loan' })
  productName!: string;

  @ApiProperty({ example: 7450.9 })
  outstandingBalance!: number;

  @ApiProperty({ example: '2026-04-20' })
  nextDueDate!: string;

  @ApiProperty({ example: 'active' })
  status!: string;
}
