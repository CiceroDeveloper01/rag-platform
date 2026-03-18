import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../../interfaces/authenticated-request.interface';
import type { UserAccessTokenPayload } from '../interfaces/user-access-token-payload.interface';
import { signHs256Jwt, verifyHs256Jwt } from '../utils/jwt.util';
import { resolveUserScopes } from '../utils/user-scope.util';

@Injectable()
export class UserAccessTokenService {
  constructor(private readonly configService: ConfigService) {}

  issueToken(user: AuthenticatedUser) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const ttlMinutes =
      this.configService.get<number>('security.userJwt.ttlMinutes', 60) ?? 60;
    const payload: UserAccessTokenPayload = {
      type: 'user',
      iss: this.configService.getOrThrow<string>('security.userJwt.issuer'),
      aud: this.configService.getOrThrow<string>('security.userJwt.audience'),
      sub: String(user.id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      scopes: user.scopes ?? resolveUserScopes(user.role),
      iat: nowInSeconds,
      exp: nowInSeconds + ttlMinutes * 60,
    };

    return signHs256Jwt(
      payload,
      this.configService.getOrThrow<string>('security.userJwt.secret'),
    );
  }

  verifyToken(token: string): AuthenticatedUser {
    const { payload } = verifyHs256Jwt<UserAccessTokenPayload>(
      token,
      this.configService.getOrThrow<string>('security.userJwt.secret'),
    );
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (payload.type !== 'user') {
      throw new UnauthorizedException('Invalid user token type');
    }

    if (payload.iss !== this.configService.getOrThrow<string>('security.userJwt.issuer')) {
      throw new UnauthorizedException('Invalid user token issuer');
    }

    if (payload.aud !== this.configService.getOrThrow<string>('security.userJwt.audience')) {
      throw new UnauthorizedException('Invalid user token audience');
    }

    if (payload.exp <= nowInSeconds) {
      throw new UnauthorizedException('User token expired');
    }

    return {
      id: Number.parseInt(payload.sub, 10),
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      scopes: payload.scopes,
    };
  }
}
