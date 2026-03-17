import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export class ExecutionContextHelper {
  static isHttp(context: ExecutionContext): boolean {
    return context.getType<'http' | 'rpc' | 'ws'>() === 'http';
  }

  static getHttpRequest(
    context: ExecutionContext,
  ): (Request & { route?: { path?: string }; id?: string }) | null {
    if (!this.isHttp(context)) {
      return null;
    }

    return context
      .switchToHttp()
      .getRequest<Request & { route?: { path?: string }; id?: string }>();
  }

  static resolveRoute(
    request: Request & { route?: { path?: string }; originalUrl?: string },
  ): string {
    const routePath = request.route?.path;

    if (routePath) {
      const normalizedRoutePath = routePath === '/' ? '' : routePath;
      return (
        `${request.baseUrl}${normalizedRoutePath}` || request.baseUrl || '/'
      );
    }

    return (
      request.path ??
      request.originalUrl?.split('?')[0] ??
      request.url.split('?')[0] ??
      'unknown_route'
    );
  }
}
