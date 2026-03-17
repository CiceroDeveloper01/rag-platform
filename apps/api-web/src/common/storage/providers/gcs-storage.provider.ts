import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import type { FileStorage } from '../interfaces/file-storage.interface';

@Injectable()
export class GcsStorageProvider implements FileStorage {
  private readonly client: Storage;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.gcs.bucket', '');
    this.publicBaseUrl = this.configService.get<string>(
      'storage.gcs.publicBaseUrl',
      '',
    );
    this.client = new Storage({
      projectId:
        this.configService.get<string>('storage.gcs.projectId') || undefined,
      keyFilename:
        this.configService.get<string>('storage.gcs.keyFilename') || undefined,
    });
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const remoteFile = this.getFile(key);
    await remoteFile.save(file, { metadata: { metadata } });

    return this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : `gs://${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const [buffer] = await this.getFile(key).download();
    return buffer;
  }

  async delete(key: string): Promise<void> {
    await this.getFile(key).delete({ ignoreNotFound: true });
  }

  async exists(key: string): Promise<boolean> {
    const [exists] = await this.getFile(key).exists();
    return exists;
  }

  private getFile(key: string) {
    if (!this.bucket) {
      throw new ServiceUnavailableException(
        'GCS storage provider is not configured',
      );
    }

    return this.client.bucket(this.bucket).file(key);
  }
}
