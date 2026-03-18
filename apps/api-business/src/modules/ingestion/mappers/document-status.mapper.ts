import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { SourceRecord } from '../interfaces/source-record.interface';
import { DocumentStatusResponse } from '../dtos/response/document-status.response';

@Injectable()
export class DocumentStatusMapper {
  toResponse(source: SourceRecord): DocumentStatusResponse {
    return plainToInstance(
      DocumentStatusResponse,
      {
        documentId: source.id,
        fileName: source.filename,
        sourceChannel: source.sourceChannel ?? null,
        status: source.ingestionStatus,
        currentStep: source.ingestionCurrentStep ?? null,
        createdAt: source.uploadedAt.toISOString(),
        updatedAt: (source.updatedAt ?? source.uploadedAt).toISOString(),
        processingStartedAt: source.processingStartedAt?.toISOString() ?? null,
        completedAt: source.completedAt?.toISOString() ?? null,
        errorMessage: source.ingestionFailureReason ?? null,
        retryCount: source.ingestionAttemptCount ?? 0,
        lastFailureAt: source.lastFailureAt?.toISOString() ?? null,
        replayEligible: source.ingestionStatus === 'FAILED',
        chunksCount: source.chunksCount ?? 0,
      },
      { excludeExtraneousValues: true },
    );
  }

  toResponseList(sources: SourceRecord[]): DocumentStatusResponse[] {
    return sources.map((source) => this.toResponse(source));
  }
}
