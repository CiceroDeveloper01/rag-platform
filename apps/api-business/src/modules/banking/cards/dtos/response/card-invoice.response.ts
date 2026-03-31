import { ApiProperty } from '@nestjs/swagger';

export class CardInvoiceResponse {
  @ApiProperty({ example: 'card-001' })
  cardId!: string;

  @ApiProperty({ example: '2026-04-10' })
  dueDate!: string;

  @ApiProperty({ example: 1280.44 })
  amount!: number;

  @ApiProperty({ example: 320.11 })
  minimumPayment!: number;
}
