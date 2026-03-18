import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'demo@ragplatform.dev' })
  email!: string;

  @ApiProperty({ example: 'Demo Operator' })
  name!: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}
