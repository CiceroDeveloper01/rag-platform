import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthenticatedUserResponse {
  @Expose()
  @ApiProperty({ example: 1 })
  id!: number;

  @Expose()
  @ApiProperty({ example: 'demo@ragplatform.dev' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'Demo Operator' })
  name!: string;

  @Expose()
  @ApiProperty({ example: 'admin', enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}
