import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatusQueryRequest } from '../dtos/request/document-status-query.request';
import { ListSourcesRequest } from '../dtos/request/list-sources.request';
import { UpdateSourceRequest } from '../dtos/request/update-source.request';
import { IngestionService } from './ingestion.service';
import { SOURCE_REPOSITORY } from '../interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../interfaces/source-repository.interface';
import { DocumentStatusMapper } from '../mappers/document-status.mapper';

@Injectable()
export class SourcesService {
  constructor(
    @Inject(SOURCE_REPOSITORY)
    private readonly sourceRepository: SourceRepositoryInterface,
    private readonly documentStatusMapper: DocumentStatusMapper,
    private readonly ingestionService: IngestionService,
  ) {}

  async list(dto: ListSourcesRequest) {
    return this.sourceRepository.list({
      limit: dto.limit ?? 25,
      offset: dto.offset ?? 0,
      query: dto.q,
      type: dto.type,
      order: dto.order ?? 'desc',
    });
  }

  async listDocumentStatuses(dto: DocumentStatusQueryRequest) {
    const sources = await this.sourceRepository.list({
      limit: dto.limit ?? 25,
      offset: dto.offset ?? 0,
      query: dto.q,
      type: dto.type,
      order: dto.order ?? 'desc',
    });

    return this.documentStatusMapper.toResponseList(sources);
  }

  async getDocumentStatus(sourceId: number) {
    const source = await this.sourceRepository.findById(sourceId);

    if (!source) {
      throw new NotFoundException(`Source ${sourceId} not found`);
    }

    return this.documentStatusMapper.toResponse(source);
  }

  async update(sourceId: number, dto: UpdateSourceRequest) {
    const source = await this.sourceRepository.update(sourceId, dto);

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    return source;
  }

  async delete(sourceId: number) {
    const source = await this.sourceRepository.findById(sourceId);

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    await this.sourceRepository.delete(sourceId);
    return { success: true };
  }

  async replay(sourceId: number) {
    return this.ingestionService.replayFailedIngestion(sourceId);
  }
}
