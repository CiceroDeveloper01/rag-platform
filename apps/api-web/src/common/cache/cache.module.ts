import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { createClient } from 'redis';
import { REDIS_CACHE_CLIENT } from './cache.constants';
import { AppCacheService } from './services/app-cache.service';

interface RedisLikeClient {
  isOpen: boolean;
  quit(): Promise<void>;
}

class RedisCacheLifecycle implements OnApplicationShutdown {
  constructor(private readonly redisClient: RedisLikeClient | null) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }
}

@Global()
@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const ttl = configService.get<number>('cache.defaultTtl', 30);
        const redisEnabled = configService.get<boolean>(
          'cache.redis.enabled',
          false,
        );

        if (!redisEnabled) {
          return {
            isGlobal: true,
            ttl,
          };
        }

        return {
          isGlobal: true,
          ttl,
          store: await redisStore({
            socket: {
              host: configService.get<string>('cache.redis.host', 'localhost'),
              port: configService.get<number>('cache.redis.port', 6379),
            },
            username:
              configService.get<string>('cache.redis.username') || undefined,
            password:
              configService.get<string>('cache.redis.password') || undefined,
            database: configService.get<number>('cache.redis.db', 0),
            ttl,
          }),
        };
      },
    }),
  ],
  providers: [
    {
      provide: REDIS_CACHE_CLIENT,
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<unknown | null> => {
        const redisEnabled = configService.get<boolean>(
          'cache.redis.enabled',
          false,
        );

        if (!redisEnabled) {
          return null;
        }

        const client = createClient({
          socket: {
            host: configService.get<string>('cache.redis.host', 'localhost'),
            port: configService.get<number>('cache.redis.port', 6379),
          },
          username:
            configService.get<string>('cache.redis.username') || undefined,
          password:
            configService.get<string>('cache.redis.password') || undefined,
          database: configService.get<number>('cache.redis.db', 0),
        });

        await client.connect();
        return client;
      },
    },
    {
      provide: RedisCacheLifecycle,
      inject: [REDIS_CACHE_CLIENT],
      useFactory: (redisClient: RedisLikeClient | null) =>
        new RedisCacheLifecycle(redisClient),
    },
    AppCacheService,
  ],
  exports: [AppCacheService],
})
export class CommonCacheModule {}
