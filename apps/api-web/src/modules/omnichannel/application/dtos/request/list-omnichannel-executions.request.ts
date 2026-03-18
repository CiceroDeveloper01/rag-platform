import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OmnichannelExecutionStatus } from '../../../domain/enums/omnichannel-execution-status.enum';

export class ListOmnichannelExecutionsRequest {
  @ApiPropertyOptional({
    enum: OmnichannelExecutionStatus,
    example: OmnichannelExecutionStatus.SUCCESS,
  })
  @IsOptional()
  @IsEnum(OmnichannelExecutionStatus)
  status?: OmnichannelExecutionStatus;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
