import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { hashPassword } from '../../../common/utils/password.util';
import { DatabaseService } from '../../../infra/database/database.service';
import { MetricsService } from '../../../infra/observability/metrics.service';
import { AUTH_REPOSITORY } from '../interfaces/auth-repository.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const authRepository = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    createSession: jest.fn(),
    findSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeSessionsByUserId: jest.fn(),
  };

  const metricsService = {
    recordAuthLogin: jest.fn(),
  };

  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AUTH_REPOSITORY,
          useValue: authRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const values: Record<string, unknown> = {
                'auth.sessionTtlHours': 8,
                'auth.demoUser.email': 'demo@ragplatform.dev',
                'auth.demoUser.password': 'demo123',
                'auth.demoUser.fullName': 'Demo Operator',
              };

              return values[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
        {
          provide: DatabaseService,
          useValue: {
            isEnabled: false,
          },
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('creates a session for valid credentials', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 7,
      email: 'demo@ragplatform.dev',
      fullName: 'Demo Operator',
      role: 'admin',
      passwordHash: hashPassword('demo123'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    authRepository.createSession.mockResolvedValue({
      id: 1,
      userId: 7,
      tokenHash: 'hashed',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });

    const session = await service.login('demo@ragplatform.dev', 'demo123');

    expect(session.user).toEqual(
      expect.objectContaining({
        id: 7,
        email: 'demo@ragplatform.dev',
        role: 'admin',
      }),
    );
    expect(session.sessionToken).toEqual(expect.any(String));
    expect(authRepository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        tokenHash: expect.any(String),
      }),
    );
    expect(metricsService.recordAuthLogin).toHaveBeenCalledWith('success');
  });

  it('rejects invalid credentials', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      service.login('demo@ragplatform.dev', 'wrong'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(metricsService.recordAuthLogin).toHaveBeenCalledWith('error');
  });
});
