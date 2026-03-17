import { Injectable } from '@nestjs/common';

@Injectable()
export class TextParserService {
  async extractText(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8').trim();
  }
}
