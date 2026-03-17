import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddConversationMessageRequest {
  @ApiProperty({
    example: 'Summarize the ingestion pipeline for me.',
    description: 'Conversation message content.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12000)
  content!: string;

  @ApiProperty({
    example: 'user',
    enum: ['user', 'assistant', 'system'],
    description: 'Role associated with the conversation message.',
  })
  @IsString()
  @IsIn(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system';
}
