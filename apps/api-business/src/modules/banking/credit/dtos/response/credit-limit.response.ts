import { ApiProperty } from '@nestjs/swagger';

export class CreditLimitResponse {
  @ApiProperty({ example: 30000 })
  totalLimit!: number;

  @ApiProperty({ example: 18000 })
  availableLimit!: number;

  @ApiProperty({ example: true })
  preApproved!: boolean;
}
