import { Injectable } from "@nestjs/common";

@Injectable()
export class ChunkDocumentToolService {
  execute(text: string, maxChunkSize = 600): string[] {
    const normalized = text.trim();
    if (!normalized) {
      return [];
    }

    const chunks: string[] = [];
    for (let cursor = 0; cursor < normalized.length; cursor += maxChunkSize) {
      chunks.push(normalized.slice(cursor, cursor + maxChunkSize));
    }

    return chunks;
  }
}
