import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthenticatedUserResponse } from './authenticated-user.response';

export class MeResponse {
  @Expose()
  @Type(() => AuthenticatedUserResponse)
  @ApiProperty({ type: () => AuthenticatedUserResponse })
  user!: AuthenticatedUserResponse;
}
