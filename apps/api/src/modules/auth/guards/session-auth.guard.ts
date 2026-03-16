import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';
import { parseCookieHeader } from '../../../common/utils/cookie.util';
import { AuthService } from '../services/auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
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

    request.user = user;
    request.authSessionToken = sessionToken;
    return true;
  }
}
