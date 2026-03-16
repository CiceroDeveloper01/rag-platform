import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConnectorHealthStatus } from '../../domain/enums/connector-health-status.enum';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

export class ListConnectorsQuery {
  @ApiPropertyOptional({
    enum: MessageChannel,
    example: MessageChannel.TELEGRAM,
  })
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => normalizeBoolean(value))
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    enum: ConnectorHealthStatus,
    example: ConnectorHealthStatus.HEALTHY,
  })
  @IsOptional()
  @IsEnum(ConnectorHealthStatus)
  healthStatus?: ConnectorHealthStatus;
}
