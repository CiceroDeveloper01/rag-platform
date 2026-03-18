import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedService } from '../interfaces/authenticated-service.interface';
import type { InternalServiceTokenPayload } from '../interfaces/internal-service-token-payload.interface';
import { verifyHs256Jwt } from '../utils/jwt.util';

@Injectable()
export class InternalServiceAuthService {
  constructor(private readonly configService: ConfigService) {}

  verifyToken(token: string): AuthenticatedService {
    const payload = verifyHs256Jwt<InternalServiceTokenPayload>(
      token,
      this.configService.getOrThrow<string>('security.internalService.secret'),
    );
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const clockSkewSeconds =
      this.configService.get<number>('security.internalService.clockSkewSeconds', 30) ?? 30;
    const allowedSubjects =
      this.configService.get<string[]>(
        'security.internalService.allowedSubjects',
        [],
      ) ?? [];

    if (payload.type !== 'service') {
      throw new UnauthorizedException('Invalid internal token type');
    }

    if (payload.iss !== this.configService.getOrThrow<string>('security.internalService.issuer')) {
      throw new UnauthorizedException('Invalid internal token issuer');
    }

    if (payload.aud !== this.configService.getOrThrow<string>('security.internalService.audience')) {
      throw new UnauthorizedException('Invalid internal token audience');
    }

    if (!allowedSubjects.includes(payload.sub)) {
      throw new UnauthorizedException('Internal service subject is not allowed');
    }

    if (payload.exp + clockSkewSeconds < nowInSeconds) {
      throw new UnauthorizedException('Internal token expired');
    }

    return {
      type: 'service',
      subject: payload.sub,
      issuer: payload.iss,
      audience: payload.aud,
      scopes: payload.scope
        .split(/\s+/)
        .map((scope) => scope.trim())
        .filter(Boolean),
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  }
}
