import { ApiProperty } from '@nestjs/swagger';

export class CardResponse {
  @ApiProperty({ example: 'card-001' })
  id!: string;

  @ApiProperty({ example: 'Visa Infinite' })
  brand!: string;

  @ApiProperty({ example: '4432' })
  last4!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  holderName!: string;
}
