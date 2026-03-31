import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnblockCardRequest {
  @ApiPropertyOptional({
    example: 'customer_confirmation',
    description: 'Reason associated with the unblock request.',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    example: 'account-manager-ai',
    description: 'Actor requesting the unblock action.',
  })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}
