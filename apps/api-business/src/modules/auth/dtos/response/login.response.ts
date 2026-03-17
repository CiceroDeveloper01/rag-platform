import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthenticatedUserResponse } from './authenticated-user.response';

export class LoginResponse {
  @Expose()
  @ApiProperty({ example: 'opaque-session-token' })
  token!: string;

  @Expose()
  @ApiProperty({ example: '2026-03-13T18:00:00.000Z' })
  expiresAt!: string;

  @Expose()
  @Type(() => AuthenticatedUserResponse)
  @ApiProperty({ type: () => AuthenticatedUserResponse })
  user!: AuthenticatedUserResponse;
}
