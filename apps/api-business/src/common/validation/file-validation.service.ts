import { extname } from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationService {
  constructor(private readonly configService: ConfigService) {}

  validateDocumentUpload(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('A file must be provided');
    }

    const maxSizeMb = this.configService.get<number>(
      'storage.upload.maxDocumentSizeMb',
      10,
    );
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `The uploaded file exceeds the maximum allowed size of ${String(maxSizeMb)} MB`,
      );
    }

    const allowedTypes = this.configService.get<string[]>(
      'storage.upload.allowedDocumentTypes',
      ['pdf', 'txt', 'md', 'docx'],
    );
    const extension = extname(file.originalname).replace('.', '').toLowerCase();

    if (!allowedTypes.includes(extension)) {
      throw new BadRequestException(
        `The uploaded file type ".${extension}" is not allowed`,
      );
    }

    const mimeType = file.mimetype.toLowerCase();
    const allowedMimeTypes = this.buildAllowedMimeTypes(allowedTypes);

    if (!allowedMimeTypes.has(mimeType)) {
      throw new BadRequestException(
        `The uploaded MIME type "${mimeType}" is not allowed`,
      );
    }
  }

  sanitizeFilename(filename: string): string {
    const normalized = filename
      .normalize('NFKD')
      .replace(/[^\w.\- ]+/g, '-')
      .replace(/\.\.+/g, '.')
      .replace(/[\\/]/g, '-')
      .trim();

    return normalized || 'document';
  }

  sanitizeMetadata(
    metadata?: Record<string, unknown> | null,
  ): Record<string, string> {
    if (!metadata) {
      return {};
    }

    return Object.entries(metadata).reduce<Record<string, string>>(
      (accumulator, [key, value]) => {
        const sanitizedKey = key
          .normalize('NFKD')
          .replace(/[^\w.-]+/g, '_')
          .slice(0, 64);

        if (!sanitizedKey) {
          return accumulator;
        }

        const sanitizedValue = String(value ?? '')
          .replace(/[<>]/g, '')
          .replace(/[\r\n\t]+/g, ' ')
          .trim()
          .slice(0, 512);

        accumulator[sanitizedKey] = sanitizedValue;
        return accumulator;
      },
      {},
    );
  }

  private buildAllowedMimeTypes(allowedTypes: string[]): Set<string> {
    const mimeTypes = new Set<string>();

    if (allowedTypes.includes('pdf')) {
      mimeTypes.add('application/pdf');
    }

    if (allowedTypes.includes('txt')) {
      mimeTypes.add('text/plain');
    }

    if (allowedTypes.includes('md')) {
      mimeTypes.add('text/markdown');
      mimeTypes.add('text/x-markdown');
      mimeTypes.add('text/plain');
    }

    if (allowedTypes.includes('docx')) {
      mimeTypes.add(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    }

    return mimeTypes;
  }
}
