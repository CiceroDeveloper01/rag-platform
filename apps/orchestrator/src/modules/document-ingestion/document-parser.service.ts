import { BadRequestException, Injectable } from "@nestjs/common";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

@Injectable()
export class DocumentParserService {
  async parse(payload: {
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<string> {
    if (payload.mimeType === "application/pdf") {
      const parser = new PDFParse({ data: payload.fileBuffer });
      const parsed = await parser.getText();
      return parsed.text.trim();
    }

    if (
      payload.mimeType === "text/plain" ||
      payload.mimeType === "text/markdown" ||
      payload.mimeType === "text/x-markdown"
    ) {
      return payload.fileBuffer.toString("utf-8").trim();
    }

    if (
      payload.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: payload.fileBuffer });
      return result.value.trim();
    }

    throw new BadRequestException(
      `Unsupported document type for ingestion: ${payload.mimeType}`,
    );
  }
}
