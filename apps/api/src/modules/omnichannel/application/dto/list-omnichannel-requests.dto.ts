import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessageStatus } from '../../domain/enums/omnichannel-message-status.enum';

export class ListOmnichannelRequestsDto {
  @ApiPropertyOptional({
    enum: MessageChannel,
    example: MessageChannel.TELEGRAM,
  })
  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @ApiPropertyOptional({
    enum: OmnichannelMessageStatus,
    example: OmnichannelMessageStatus.PROCESSED,
  })
  @IsOptional()
  @IsEnum(OmnichannelMessageStatus)
  status?: OmnichannelMessageStatus;

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
