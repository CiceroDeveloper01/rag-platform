import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { storageConfig } from '../../../config/storage.config';
import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let baseDir: string;

  beforeEach(async () => {
    baseDir = await mkdtemp(join(tmpdir(), 'rag-platform-storage-'));
    process.env.LOCAL_STORAGE_PATH = baseDir;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [storageConfig],
          ignoreEnvFile: true,
        }),
      ],
      providers: [LocalStorageProvider],
    }).compile();

    provider = moduleRef.get(LocalStorageProvider);
  });

  afterEach(async () => {
    delete process.env.LOCAL_STORAGE_PATH;
    await rm(baseDir, { recursive: true, force: true });
  });

  it('uploads, reads and deletes files locally', async () => {
    const url = await provider.upload(Buffer.from('hello'), 'docs/demo.txt', {
      filename: 'demo.txt',
    });

    await expect(provider.exists('docs/demo.txt')).resolves.toBe(true);
    await expect(provider.download('docs/demo.txt')).resolves.toEqual(
      Buffer.from('hello'),
    );
    expect(url).toContain('docs/demo.txt');

    await provider.delete('docs/demo.txt');
    await expect(provider.exists('docs/demo.txt')).resolves.toBe(false);
  });
});
