import { ApiProperty } from '@nestjs/swagger';

export class CustomerProfileResponse {
  @ApiProperty({ example: 'cust-001' })
  id!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  fullName!: string;

  @ApiProperty({ example: 'ada@rag-bank.test' })
  email!: string;

  @ApiProperty({ example: 'Prime' })
  segment!: string;

  @ApiProperty({ example: 'active' })
  relationshipStatus!: string;
}
