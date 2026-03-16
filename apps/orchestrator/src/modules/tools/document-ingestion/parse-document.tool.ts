import { Injectable } from "@nestjs/common";
import { DownloadedDocument } from "./download-file.tool";

@Injectable()
export class ParseDocumentToolService {
  async execute(document: DownloadedDocument): Promise<string> {
    const parsed = [
      document.fileName,
      document.mimeType,
      document.extractedText ?? "",
      document.bodyFallback ?? "",
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!parsed) {
      throw new Error(
        "Document parsing failed because no textual content was available",
      );
    }

    return parsed;
  }
}
