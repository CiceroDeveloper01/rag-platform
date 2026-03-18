import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { FileStorage } from './interfaces/file-storage.interface';
import { AzureBlobStorageProvider } from './providers/azure-blob-storage.provider';
import { GcsStorageProvider } from './providers/gcs-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { FILE_STORAGE } from './storage.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): FileStorage => {
        const provider = configService.get<string>('storage.provider', 'local');

        switch (provider) {
          case 's3':
            return new S3StorageProvider(configService);
          case 'azure':
            return new AzureBlobStorageProvider(configService);
          case 'gcs':
            return new GcsStorageProvider(configService);
          case 'local':
          default:
            return new LocalStorageProvider(configService);
        }
      },
    },
  ],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
