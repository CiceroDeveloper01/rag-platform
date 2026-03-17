import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedUserResponse } from './authenticated-user.response';

export class MeResponse {
  @ApiProperty({ type: () => AuthenticatedUserResponse })
  user!: AuthenticatedUserResponse;
}
