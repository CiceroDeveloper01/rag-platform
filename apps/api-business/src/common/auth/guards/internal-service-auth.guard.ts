import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { BEARER_PREFIX } from '../constants/auth.constants';
import type { AuthenticatedRequest } from '../../interfaces/authenticated-request.interface';
import { InternalServiceAuthService } from '../services/internal-service-auth.service';

@Injectable()
export class InternalServiceAuthGuard implements CanActivate {
  constructor(
    private readonly internalServiceAuthService: InternalServiceAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InternalServiceAuthGuard.name);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
      this.logger.warn(
        {
          requestId: request.headers['x-request-id'],
        },
        'Missing internal service bearer token',
      );
      throw new UnauthorizedException('Internal service authentication is required');
    }

    request.service = this.internalServiceAuthService.verifyToken(
      authorizationHeader.slice(BEARER_PREFIX.length),
    );
    return true;
  }
}
