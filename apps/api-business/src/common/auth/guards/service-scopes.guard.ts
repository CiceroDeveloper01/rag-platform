import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SERVICE_SCOPES_KEY } from '../../decorators/service-scopes.decorator';
import type { AuthenticatedRequest } from '../../interfaces/authenticated-request.interface';

@Injectable()
export class ServiceScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes =
      this.reflector.getAllAndOverride<string[]>(SERVICE_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.service) {
      return true;
    }

    const grantedScopes = request.service.scopes;
    const hasRequiredScope = requiredScopes.every((scope) =>
      grantedScopes.includes(scope) || grantedScopes.includes('internal:*'),
    );

    if (!hasRequiredScope) {
      throw new ForbiddenException('Internal service scope is insufficient');
    }

    return true;
  }
}
