import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';
import type { FileStorage } from '../interfaces/file-storage.interface';

@Injectable()
export class AzureBlobStorageProvider implements FileStorage {
  private readonly client: BlobServiceClient;
  private readonly container: string;

  constructor(private readonly configService: ConfigService) {
    this.container = this.configService.get<string>(
      'storage.azure.container',
      '',
    );
    const connectionString = this.configService.get<string>(
      'storage.azure.connectionString',
      '',
    );
    const accountUrl = this.configService.get<string>(
      'storage.azure.accountUrl',
      '',
    );

    this.client = connectionString
      ? BlobServiceClient.fromConnectionString(connectionString)
      : new BlobServiceClient(accountUrl);
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const blobClient = await this.getBlobClient(key);
    await blobClient.uploadData(file, { metadata });
    return blobClient.url;
  }

  async download(key: string): Promise<Buffer> {
    const blobClient = await this.getBlobClient(key);
    const response = await blobClient.download();
    const chunks: Buffer[] = [];
    for await (const chunk of response.readableStreamBody ?? []) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const blobClient = await this.getBlobClient(key);
    await blobClient.deleteIfExists();
  }

  async exists(key: string): Promise<boolean> {
    const blobClient = await this.getBlobClient(key);
    return blobClient.exists();
  }

  private async getBlobClient(key: string) {
    if (!this.container) {
      throw new ServiceUnavailableException(
        'Azure Blob storage provider is not configured',
      );
    }

    const containerClient = this.client.getContainerClient(this.container);
    await containerClient.createIfNotExists();
    return containerClient.getBlockBlobClient(key);
  }
}
