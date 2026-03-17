import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedUser } from '../../../common/interfaces/authenticated-request.interface';
import { AuthenticatedUserResponse } from '../dtos/response/authenticated-user.response';
import { LoginResponse } from '../dtos/response/login.response';
import { LogoutResponse } from '../dtos/response/logout.response';
import { MeResponse } from '../dtos/response/me.response';

@Injectable()
export class AuthResponseMapper {
  toLoginResponse(input: {
    sessionToken: string;
    expiresAt: Date;
    user: {
      id: number;
      email: string;
      fullName: string;
      role: 'admin' | 'user';
    };
  }): LoginResponse {
    return plainToInstance(
      LoginResponse,
      {
        token: input.sessionToken,
        expiresAt: input.expiresAt.toISOString(),
        user: this.toAuthenticatedUser(input.user),
      },
      { excludeExtraneousValues: true },
    );
  }

  toMeResponse(user: AuthenticatedUser): MeResponse {
    return plainToInstance(
      MeResponse,
      {
        user: this.toAuthenticatedUser(user),
      },
      { excludeExtraneousValues: true },
    );
  }

  toLogoutResponse(): LogoutResponse {
    return plainToInstance(
      LogoutResponse,
      { success: true },
      { excludeExtraneousValues: true },
    );
  }

  private toAuthenticatedUser(input: {
    id: number;
    email: string;
    fullName: string;
    role: 'admin' | 'user';
  }): AuthenticatedUserResponse {
    return plainToInstance(
      AuthenticatedUserResponse,
      {
        id: input.id,
        email: input.email,
        name: input.fullName,
        role: input.role,
      },
      { excludeExtraneousValues: true },
    );
  }
}
