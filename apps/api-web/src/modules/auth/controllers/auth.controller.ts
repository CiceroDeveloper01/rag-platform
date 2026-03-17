import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../../../common/interfaces/authenticated-request.interface';
import {
  buildSessionCookieOptions,
  parseCookieHeader,
} from '../../../common/utils/cookie.util';
import {
  LoginRequest,
} from '../dtos/request/login.request';
import { LoginResponse } from '../dtos/response/login.response';
import { LogoutResponse } from '../dtos/response/logout.response';
import { MeResponse } from '../dtos/response/me.response';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller(['auth', 'api/v1/auth'])
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticates a user and creates a session cookie.',
  })
  @ApiBody({ type: LoginRequest })
  @ApiOkResponse({
    description: 'Authentication succeeded.',
    type: LoginResponse,
  })
  async login(
    @Body() dto: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto.email, dto.password);
    const cookieName = this.configService.get<string>(
      'auth.sessionCookieName',
      'rag_platform_session',
    );

    response.cookie(
      cookieName,
      session.sessionToken,
      buildSessionCookieOptions(this.configService, session.expiresAt),
    );

    return {
      token: session.sessionToken,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.fullName,
        role: session.user.role,
      },
    };
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Returns the currently authenticated user.' })
  @ApiCookieAuth('rag_platform_session')
  @ApiOkResponse({
    description: 'Authenticated user returned successfully.',
    type: MeResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
    };
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Invalidates the current authenticated session.' })
  @ApiCookieAuth('rag_platform_session')
  @ApiOkResponse({
    description: 'Logout completed successfully.',
    type: LogoutResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = parseCookieHeader(request.headers.cookie);
    const cookieName = this.configService.get<string>(
      'auth.sessionCookieName',
      'rag_platform_session',
    );
    const sessionToken = request.authSessionToken ?? cookies[cookieName];

    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    response.clearCookie(
      cookieName,
      buildSessionCookieOptions(this.configService),
    );

    return { success: true };
  }
}
