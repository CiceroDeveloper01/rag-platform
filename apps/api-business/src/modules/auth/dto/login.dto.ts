import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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

class AuthenticatedUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'demo@ragplatform.dev' })
  email!: string;

  @ApiProperty({ example: 'Demo Operator' })
  name!: string;

  @ApiProperty({ example: 'admin', enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}

export class LoginResponseDto {
  @ApiProperty({ example: 'opaque-session-token' })
  token!: string;

  @ApiProperty({ example: '2026-03-13T18:00:00.000Z' })
  expiresAt!: string;

  @ApiProperty({ type: () => AuthenticatedUserDto })
  user!: AuthenticatedUserDto;
}

export class MeResponseDto {
  @ApiProperty({ type: () => AuthenticatedUserDto })
  user!: AuthenticatedUserDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}
