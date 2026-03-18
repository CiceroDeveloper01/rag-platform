import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FileStorage } from '../interfaces/file-storage.interface';

@Injectable()
export class LocalStorageProvider implements FileStorage {
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.basePath = this.configService.get<string>(
      'storage.local.basePath',
      'storage/documents',
    );
    this.baseUrl = this.configService.get<string>('storage.local.baseUrl', '');
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    const filePath = this.resolvePath(key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file);

    if (metadata) {
      await writeFile(
        `${filePath}.metadata.json`,
        JSON.stringify(metadata, null, 2),
        'utf-8',
      );
    }

    return this.buildUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);
    await rm(filePath, { force: true });
    await rm(`${filePath}.metadata.json`, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  private resolvePath(key: string): string {
    return join(process.cwd(), this.basePath, key);
  }

  private buildUrl(key: string): string {
    if (!this.baseUrl) {
      return this.resolvePath(key);
    }

    return `${this.baseUrl.replace(/\/$/, '')}/${key}`;
  }
}
