import { Injectable } from '@nestjs/common';

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;

@Injectable()
export class ChunkingService {
  splitText(text: string, options: ChunkingOptions = {}): string[] {
    const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;
    const normalizedText = this.normalizeText(text);

    if (!normalizedText) {
      return [];
    }

    const units = this.segmentIntoUnits(normalizedText);
    const chunks: string[] = [];
    let currentChunkWords: string[] = [];
    let currentTokenEstimate = 0;

    for (const unit of units) {
      const unitWords = unit.split(/\s+/).filter(Boolean);
      const unitTokenEstimate = this.estimateTokens(unitWords.join(' '));

      if (unitTokenEstimate > chunkSize) {
        if (currentChunkWords.length > 0) {
          chunks.push(currentChunkWords.join(' '));
          currentChunkWords = this.createOverlapWords(
            currentChunkWords,
            chunkOverlap,
          );
          currentTokenEstimate = this.estimateTokens(
            currentChunkWords.join(' '),
          );
        }

        const oversizedChunks = this.splitOversizedUnit(
          unitWords,
          chunkSize,
          chunkOverlap,
        );
        chunks.push(...oversizedChunks);
        currentChunkWords = [];
        currentTokenEstimate = 0;
        continue;
      }

      if (
        currentTokenEstimate + unitTokenEstimate > chunkSize &&
        currentChunkWords.length > 0
      ) {
        chunks.push(currentChunkWords.join(' '));
        currentChunkWords = this.createOverlapWords(
          currentChunkWords,
          chunkOverlap,
        );
        currentTokenEstimate = this.estimateTokens(currentChunkWords.join(' '));
      }

      currentChunkWords.push(...unitWords);
      currentTokenEstimate = this.estimateTokens(currentChunkWords.join(' '));
    }

    if (currentChunkWords.length > 0) {
      chunks.push(currentChunkWords.join(' '));
    }

    return chunks.filter(Boolean);
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private segmentIntoUnits(text: string): string[] {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return paragraphs.flatMap((paragraph) => {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

      return sentences.length > 0 ? sentences : [paragraph];
    });
  }

  private splitOversizedUnit(
    words: string[],
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const oversizedChunks: string[] = [];
    let startIndex = 0;

    while (startIndex < words.length) {
      let endIndex = startIndex;
      let tokenEstimate = 0;

      while (endIndex < words.length) {
        const candidate = words.slice(startIndex, endIndex + 1).join(' ');
        const candidateTokens = this.estimateTokens(candidate);

        if (candidateTokens > chunkSize) {
          break;
        }

        tokenEstimate = candidateTokens;
        endIndex += 1;
      }

      if (endIndex === startIndex) {
        endIndex = Math.min(startIndex + chunkSize, words.length);
      }

      const chunkWords = words.slice(startIndex, endIndex);
      oversizedChunks.push(chunkWords.join(' '));

      if (endIndex >= words.length) {
        break;
      }

      const overlapWords = this.createOverlapWords(chunkWords, chunkOverlap);
      startIndex = Math.max(endIndex - overlapWords.length, startIndex + 1);

      if (tokenEstimate === 0) {
        startIndex = endIndex;
      }
    }

    return oversizedChunks;
  }

  private createOverlapWords(words: string[], overlapTokens: number): string[] {
    if (words.length === 0 || overlapTokens <= 0) {
      return [];
    }

    const overlapWords: string[] = [];

    for (let index = words.length - 1; index >= 0; index -= 1) {
      overlapWords.unshift(words[index]);

      if (this.estimateTokens(overlapWords.join(' ')) >= overlapTokens) {
        break;
      }
    }

    return overlapWords;
  }

  private estimateTokens(text: string): number {
    if (!text) {
      return 0;
    }

    return Math.ceil(text.length / 4);
  }
}
