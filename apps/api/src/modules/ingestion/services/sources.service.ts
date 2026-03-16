import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SOURCE_REPOSITORY } from '../interfaces/source-repository.interface';
import type { SourceRepositoryInterface } from '../interfaces/source-repository.interface';
import { ListSourcesDto } from '../dto/list-sources.dto';
import { UpdateSourceDto } from '../dto/update-source.dto';

@Injectable()
export class SourcesService {
  constructor(
    @Inject(SOURCE_REPOSITORY)
    private readonly sourceRepository: SourceRepositoryInterface,
  ) {}

  async list(dto: ListSourcesDto) {
    return this.sourceRepository.list({
      limit: dto.limit ?? 25,
      offset: dto.offset ?? 0,
      query: dto.q,
      type: dto.type,
      order: dto.order ?? 'desc',
    });
  }

  async update(sourceId: number, dto: UpdateSourceDto) {
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
}
