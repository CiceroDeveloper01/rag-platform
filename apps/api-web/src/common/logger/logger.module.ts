import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { pinoLoggerOptions } from './pino-logger.config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: pinoLoggerOptions,
    }),
  ],
  exports: [LoggerModule],
})
export class LoggerConfigModule {}
