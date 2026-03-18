import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SearchResultResponse } from './search-result.response';

export class SearchResponse {
  @Expose()
  @Type(() => SearchResultResponse)
  @ApiProperty({ type: () => [SearchResultResponse] })
  results!: SearchResultResponse[];
}
