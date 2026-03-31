import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BlockCardRequest {
  @ApiPropertyOptional({
    example: 'lost_card',
    description: 'Reason associated with the card block request.',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    example: 'account-manager-ai',
    description: 'Actor requesting the block action.',
  })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}
