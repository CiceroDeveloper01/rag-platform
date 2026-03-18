import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPES_KEY } from '../../../common/decorators/required-scopes.decorator';
import type { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userScopes = request.user?.scopes ?? [];
    const hasRequiredScope = requiredScopes.every((scope) =>
      userScopes.includes(scope) || userScopes.includes('admin:*'),
    );

    if (!hasRequiredScope) {
      throw new ForbiddenException('Insufficient scope');
    }

    return true;
  }
}
