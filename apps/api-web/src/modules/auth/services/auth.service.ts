import {
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomBytes } from 'crypto';
import {
  hashPassword,
  verifyPassword,
} from '../../../common/utils/password.util';
import { DatabaseService } from '../../../infra/database/database.service';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import type { AuthRepositoryInterface } from '../interfaces/auth-repository.interface';
import type { UserRecord } from '../interfaces/user-record.interface';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly sessionTtlHours: number;

  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryInterface,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly metricsService: MetricsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
    this.sessionTtlHours = this.configService.get<number>(
      'auth.sessionTtlHours',
      8,
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.databaseService.isEnabled) {
      this.logger.warn(
        'Skipping demo user bootstrap because the database is disabled',
      );
      return;
    }

    await this.ensureDemoUser();
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    user: UserRecord;
    sessionToken: string;
    expiresAt: Date;
  }> {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      this.metricsService.recordAuthLogin('error');
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashSessionToken(sessionToken);
    const expiresAt = new Date(
      Date.now() + this.sessionTtlHours * 60 * 60 * 1000,
    );

    await this.authRepository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    this.logger.info({ userId: user.id }, 'User authenticated successfully');
    this.metricsService.recordAuthLogin('success');

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      sessionToken,
      expiresAt,
    };
  }

  async validateSession(sessionToken: string): Promise<UserRecord | null> {
    const tokenHash = this.hashSessionToken(sessionToken);
    const session = await this.authRepository.findSession(tokenHash);

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.revokeSession(tokenHash);
      return null;
    }

    return this.authRepository.findUserById(session.userId);
  }

  async logout(sessionToken: string): Promise<void> {
    await this.authRepository.revokeSession(
      this.hashSessionToken(sessionToken),
    );
  }

  private hashSessionToken(sessionToken: string): string {
    return createHash('sha256').update(sessionToken).digest('hex');
  }

  private async ensureDemoUser(): Promise<void> {
    const email = this.configService.get<string>(
      'auth.demoUser.email',
      'demo@ragplatform.dev',
    );
    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      return;
    }

    await this.authRepository.createUser({
      email,
      passwordHash: hashPassword(
        this.configService.get<string>('auth.demoUser.password', 'demo123'),
      ),
      fullName: this.configService.get<string>(
        'auth.demoUser.fullName',
        'Demo Operator',
      ),
      role: 'admin',
    });

    this.logger.info({ email }, 'Default demo user ensured successfully');
  }
}
