import { Injectable } from "@nestjs/common";

export interface RagDocumentRecord {
  id: string;
  content: string;
  source: string;
  embedding: number[];
  createdAt: string;
}

@Injectable()
export class VectorRepository {
  private readonly documents = new Map<string, RagDocumentRecord>();

  save(document: RagDocumentRecord): RagDocumentRecord {
    this.documents.set(document.id, document);
    return document;
  }

  findSimilar(embedding: number[], limit = 5): RagDocumentRecord[] {
    return Array.from(this.documents.values())
      .map((document) => ({
        document,
        score: cosineSimilarity(document.embedding, embedding),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ document }) => document);
  }

  count(): number {
    return this.documents.size;
  }

  findById(documentId: string): RagDocumentRecord | undefined {
    return this.documents.get(documentId);
  }

  getAll(): RagDocumentRecord[] {
    return Array.from(this.documents.values());
  }
}

function cosineSimilarity(left: number[], right: number[]): number {
  const size = Math.min(left.length, right.length);

  if (size === 0) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < size; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
