import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BEARER_PREFIX } from '../constants/auth.constants';
import type { AuthenticatedRequest } from '../../interfaces/authenticated-request.interface';
import { parseCookieHeader } from '../../utils/cookie.util';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { InternalServiceAuthService } from '../services/internal-service-auth.service';

@Injectable()
export class SessionOrInternalAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly internalServiceAuthService: InternalServiceAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader?.startsWith(BEARER_PREFIX)) {
      request.service = this.internalServiceAuthService.verifyToken(
        authorizationHeader.slice(BEARER_PREFIX.length),
      );
      return true;
    }

    const cookies = parseCookieHeader(request.headers.cookie);
    const cookieName = this.configService.get<string>(
      'auth.sessionCookieName',
      'rag_platform_session',
    );
    const sessionToken = cookies[cookieName];

    if (!sessionToken) {
      throw new UnauthorizedException('Authentication is required');
    }

    const user = await this.authService.validateSession(sessionToken);

    if (!user) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    request.authSessionToken = sessionToken;
    return true;
  }
}
