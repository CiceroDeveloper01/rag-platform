import { ApiProperty } from '@nestjs/swagger';
import { SearchResultResponse } from './search-result.response';

export class SearchResponse {
  @ApiProperty({ type: () => [SearchResultResponse] })
  results!: SearchResultResponse[];
}
