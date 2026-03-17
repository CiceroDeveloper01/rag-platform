import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    example: 'demo@ragplatform.dev',
    description:
      'User email used to authenticate against the backend session API.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'demo123',
    minLength: 6,
    description:
      'Plain-text password for local and development authentication flows.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
