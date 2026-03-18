import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

export class ListExecutionsQuery {
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @IsOptional()
  @IsString()
  agentName?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeBoolean(value))
  usedRag?: boolean;

  @IsOptional()
  @IsEnum(OmnichannelExecutionStatus)
  status?: OmnichannelExecutionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
