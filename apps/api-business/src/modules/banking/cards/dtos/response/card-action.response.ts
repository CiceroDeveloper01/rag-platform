import { ApiProperty } from '@nestjs/swagger';

export class CardActionResponse {
  @ApiProperty({ example: 'card-001' })
  cardId!: string;

  @ApiProperty({ example: 'block' })
  action!: string;

  @ApiProperty({ example: 'completed' })
  status!: string;

  @ApiProperty({
    example: 'Card block request processed successfully.',
  })
  message!: string;
}
