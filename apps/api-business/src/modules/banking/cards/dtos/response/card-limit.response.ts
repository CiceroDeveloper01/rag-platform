import { ApiProperty } from '@nestjs/swagger';

export class CardLimitResponse {
  @ApiProperty({ example: 'card-001' })
  cardId!: string;

  @ApiProperty({ example: 25000 })
  totalLimit!: number;

  @ApiProperty({ example: 18000 })
  availableLimit!: number;

  @ApiProperty({ example: 7000 })
  usedLimit!: number;
}
