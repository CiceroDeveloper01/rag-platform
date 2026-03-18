import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { storageConfig } from '../../config/storage.config';
import { FileValidationService } from './file-validation.service';

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [storageConfig],
          ignoreEnvFile: true,
        }),
      ],
      providers: [FileValidationService],
    }).compile();

    service = moduleRef.get(FileValidationService);
  });

  it('accepts supported uploads', () => {
    expect(() =>
      service.validateDocumentUpload({
        originalname: 'handbook.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File),
    ).not.toThrow();
  });

  it('rejects files with unsupported extensions', () => {
    expect(() =>
      service.validateDocumentUpload({
        originalname: 'script.exe',
        mimetype: 'application/octet-stream',
        size: 1024,
      } as Express.Multer.File),
    ).toThrow('not allowed');
  });

  it('sanitizes filenames and metadata values', () => {
    expect(service.sanitizeFilename('../unsafe<>name.pdf')).toBe(
      '.-unsafe-name.pdf',
    );
    expect(
      service.sanitizeMetadata({ 'unsafe key': '<script>alert(1)</script>' }),
    ).toEqual({
      unsafe_key: 'scriptalert(1)/script',
    });
  });
});
