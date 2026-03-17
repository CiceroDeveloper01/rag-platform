import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfParserService {
  async extractText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    return parsed.text.trim();
  }
}
