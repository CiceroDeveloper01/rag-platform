import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatDto } from './chat.dto';

describe('ChatDto', () => {
  it('accepts a valid chat payload', async () => {
    const payload = plainToInstance(ChatDto, {
      question: 'What is pgvector?',
      topK: 5,
      stream: false,
      maxContextCharacters: 6000,
      conversationId: 12,
    });

    await expect(validate(payload)).resolves.toHaveLength(0);
  });

  it('rejects empty questions and invalid topK values', async () => {
    const payload = plainToInstance(ChatDto, {
      question: '',
      topK: 25,
      maxContextCharacters: 200,
      conversationId: 0,
    });

    const errors = await validate(payload);
    const constraints = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    expect(constraints).toEqual(
      expect.arrayContaining([
        expect.stringContaining('should not be empty'),
        expect.stringContaining('must not be greater than 20'),
        expect.stringContaining('must not be less than 500'),
        expect.stringContaining('must not be less than 1'),
      ]),
    );
  });
});
