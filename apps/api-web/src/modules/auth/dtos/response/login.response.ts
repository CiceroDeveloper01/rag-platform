import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserResponse } from './authenticated-user.response';

export class LoginResponse {
  @ApiProperty({ example: 'opaque-session-token' })
  token!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: '2026-03-13T18:00:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: () => AuthenticatedUserResponse })
  user!: AuthenticatedUserResponse;
}
