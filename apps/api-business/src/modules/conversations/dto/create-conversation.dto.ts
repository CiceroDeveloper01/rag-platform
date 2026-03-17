import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiPropertyOptional({
    example: 'pgvector troubleshooting',
    description: 'Optional human-friendly title for the conversation.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title?: string;
}
