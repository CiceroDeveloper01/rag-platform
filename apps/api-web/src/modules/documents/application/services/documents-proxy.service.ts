import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class DocumentsProxyService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DocumentsProxyService.name);
  }

  async uploadDocument(
    input: {
      file: Express.Multer.File;
      chunkSize?: number;
      chunkOverlap?: number;
      metadata?: string;
    },
    context: {
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([Uint8Array.from(input.file.buffer)], {
        type: input.file.mimetype,
      }),
      input.file.originalname,
    );

    if (typeof input.chunkSize === 'number') {
      formData.append('chunkSize', String(input.chunkSize));
    }

    if (typeof input.chunkOverlap === 'number') {
      formData.append('chunkOverlap', String(input.chunkOverlap));
    }

    if (input.metadata) {
      formData.append('metadata', input.metadata);
    }

    return this.request('/ingestion/upload', {
      method: 'POST',
      body: formData,
      cookieHeader: context.cookieHeader,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
  }

  async listSources(
    query: Record<string, string | number | undefined>,
    context: {
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    return this.request(this.buildPath('/sources', query), {
      method: 'GET',
      cookieHeader: context.cookieHeader,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
  }

  async updateSource(
    sourceId: number,
    payload: Record<string, unknown>,
    context: {
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    return this.request(`/sources/${String(sourceId)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      contentType: 'application/json',
      cookieHeader: context.cookieHeader,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
  }

  async deleteSource(
    sourceId: number,
    context: {
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    return this.request(`/sources/${String(sourceId)}`, {
      method: 'DELETE',
      cookieHeader: context.cookieHeader,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
  }

  async listDocumentStatuses(
    query: Record<string, string | number | undefined>,
    context: {
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    return this.request(this.buildPath('/documents/status', query), {
      method: 'GET',
      cookieHeader: context.cookieHeader,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
  }

  async getDocumentStatus(
    documentId: number,
    context: {
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    return this.request(`/documents/${String(documentId)}/status`, {
      method: 'GET',
      cookieHeader: context.cookieHeader,
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
  }

  private async request(
    path: string,
    input: {
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: BodyInit;
      contentType?: string;
      cookieHeader?: string;
      requestId?: string;
      tenantId?: string;
    },
  ) {
    const baseUrl = this.configService.getOrThrow<string>('businessApi.baseUrl');
    const controller = new AbortController();
    const timeoutMs =
      this.configService.get<number>('businessApi.timeoutMs', 10_000) ?? 10_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(new URL(path, baseUrl), {
        method: input.method,
        body: input.body,
        signal: controller.signal,
        headers: {
          ...(input.contentType ? { 'content-type': input.contentType } : {}),
          ...(input.cookieHeader ? { cookie: input.cookieHeader } : {}),
          ...(input.requestId ? { 'x-request-id': input.requestId } : {}),
          ...(input.tenantId ? { 'x-tenant-id': input.tenantId } : {}),
        },
      });

      if (!response.ok) {
        const payload = await this.parseErrorPayload(response);
        throw new HttpException(
          payload.message,
          payload.statusCode ?? response.status,
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        {
          err: error,
          method: input.method,
          path,
        },
        'Failed to proxy request to api-business',
      );
      throw new ServiceUnavailableException(
        'api-business is unavailable for document operations',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPath(
    path: string,
    query: Record<string, string | number | undefined>,
  ) {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const serialized = searchParams.toString();
    return serialized ? `${path}?${serialized}` : path;
  }

  private async parseErrorPayload(response: Response): Promise<{
    statusCode?: number;
    message: string;
  }> {
    try {
      const payload = (await response.json()) as {
        statusCode?: number;
        message?: string | string[];
      };
      return {
        statusCode: payload.statusCode,
        message: Array.isArray(payload.message)
          ? payload.message.join(', ')
          : (payload.message ?? 'Document operation failed'),
      };
    } catch {
      return {
        statusCode: response.status,
        message: `Document operation failed with status ${String(response.status)}`,
      };
    }
  }
}
