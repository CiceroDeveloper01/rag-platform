import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRequest {
  @ApiPropertyOptional({
    example: 'tenant-acme',
    description:
      'Explicit tenant scope for internal or service-to-service semantic retrieval.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;

  @ApiProperty({
    example: 'How does omnichannel message normalization work?',
    description:
      'Natural language query used to search semantically similar documents.',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 20,
    description: 'Legacy limit parameter supported by the search endpoint.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 20,
    description:
      'Preferred number of top results returned by semantic retrieval.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  top_k?: number;
}
