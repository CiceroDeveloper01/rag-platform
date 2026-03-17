import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { FileStorage } from '../interfaces/file-storage.interface';

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

@Injectable()
export class S3StorageProvider implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.s3.bucket', '');
    this.publicBaseUrl = this.configService.get<string>(
      'storage.s3.publicBaseUrl',
      '',
    );

    this.client = new S3Client({
      region: this.configService.get<string>('storage.s3.region', ''),
      endpoint:
        this.configService.get<string>('storage.s3.endpoint') || undefined,
      credentials: {
        accessKeyId: this.configService.get<string>(
          'storage.s3.accessKeyId',
          '',
        ),
        secretAccessKey: this.configService.get<string>(
          'storage.s3.secretAccessKey',
          '',
        ),
      },
      forcePathStyle: Boolean(
        this.configService.get<string>('storage.s3.endpoint'),
      ),
    });
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    this.assertConfigured();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        Metadata: metadata,
      }),
    );

    return this.publicBaseUrl
      ? `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`
      : `s3://${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    this.assertConfigured();
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return streamToBuffer(response.Body);
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured();
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    this.assertConfigured();
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  private assertConfigured(): void {
    if (!this.bucket) {
      throw new ServiceUnavailableException(
        'S3 storage provider is not configured',
      );
    }
  }
}
