import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LogoutResponse {
  @Expose()
  @ApiProperty({ example: true })
  success!: boolean;
}
