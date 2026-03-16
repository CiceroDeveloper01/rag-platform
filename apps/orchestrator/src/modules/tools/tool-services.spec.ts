import { DocumentIndexerService } from "../rag/document-indexer.service";
import { RetrievalService } from "../rag/retrieval.service";
import { DownloadFileToolService } from "./document-ingestion/download-file.tool";
import { GenerateEmbeddingsToolService } from "./document-ingestion/generate-embeddings.tool";
import { IndexDocumentToolService } from "./document-ingestion/index-document.tool";
import { ParseDocumentToolService } from "./document-ingestion/parse-document.tool";
import { RetrieveDocumentsToolService } from "./retrieval/retrieve-documents.tool";

describe("Tool services", () => {
  it("generates embeddings for each chunk using the document indexer", () => {
    const service = new GenerateEmbeddingsToolService({
      createQueryEmbedding: jest
        .fn()
        .mockReturnValueOnce([1, 2])
        .mockReturnValueOnce([3, 4]),
    } as unknown as DocumentIndexerService);

    expect(service.execute(["first chunk", "second chunk"])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("indexes every chunk with chunk metadata", async () => {
    const documentIndexerService = {
      indexDocument: jest
        .fn()
        .mockResolvedValueOnce({ id: "chunk-1" })
        .mockResolvedValueOnce({ id: "chunk-2" }),
    } as unknown as DocumentIndexerService;
    const service = new IndexDocumentToolService(documentIndexerService);

    const records = await service.execute({
      chunks: ["first", "second"],
      source: "telegram:policy.pdf",
      tenantId: "tenant-a",
      externalMessageId: "msg-1",
      metadata: {
        fileName: "policy.pdf",
      },
    });

    expect(documentIndexerService.indexDocument).toHaveBeenNthCalledWith(
      1,
      "first",
      "telegram:policy.pdf:chunk-1",
      expect.objectContaining({
        externalMessageId: "msg-1:chunk-1",
        metadata: expect.objectContaining({
          chunkIndex: 1,
          chunkCount: 2,
        }),
      }),
    );
    expect(records).toEqual([{ id: "chunk-1" }, { id: "chunk-2" }]);
  });

  it("delegates retrieval to the retrieval service", async () => {
    const retrievalService = {
      retrieveRelevantDocuments: jest
        .fn()
        .mockResolvedValue([{ id: "doc-1", content: "policy" }]),
    } as unknown as RetrievalService;
    const service = new RetrieveDocumentsToolService(retrievalService);

    await expect(
      service.execute({
        tenantId: "tenant-a",
        question: "Where is the policy?",
        limit: 5,
      }),
    ).resolves.toEqual([{ id: "doc-1", content: "policy" }]);

    expect(retrievalService.retrieveRelevantDocuments).toHaveBeenCalledWith({
      tenantId: "tenant-a",
      question: "Where is the policy?",
      limit: 5,
    });
  });

  it("resolves downloaded document metadata from attachments and message fallbacks", async () => {
    const service = new DownloadFileToolService();

    await expect(
      service.execute({
        message: {
          externalMessageId: "msg-1",
          subject: "invoice",
          body: "See attachment",
          attachments: [
            {
              providerFileId: "file-1",
              fileName: "invoice.pdf",
              mimeType: "application/pdf",
              fileSize: 1024,
              extractedText: "Invoice content",
            },
          ],
        } as any,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        documentId: "file-1",
        fileName: "invoice.pdf",
        mimeType: "application/pdf",
        bodyFallback: "See attachment",
      }),
    );
  });

  it("parses textual document content and fails when no text is available", async () => {
    const service = new ParseDocumentToolService();

    await expect(
      service.execute({
        documentId: "doc-1",
        fileName: "invoice.pdf",
        mimeType: "application/pdf",
        extractedText: "Invoice body",
      }),
    ).resolves.toContain("Invoice body");

    await expect(
      service.execute({
        documentId: "doc-2",
        fileName: undefined as unknown as string,
        mimeType: undefined as unknown as string,
      } as any),
    ).rejects.toThrow(
      "Document parsing failed because no textual content was available",
    );
  });

  it("defaults download metadata when neither canonical document nor attachment exists", async () => {
    const service = new DownloadFileToolService();

    await expect(
      service.execute({
        message: {
          externalMessageId: "msg-2",
          subject: "",
          body: "Fallback body",
        } as any,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        documentId: "msg-2",
        fileName: "",
        mimeType: "application/octet-stream",
        bodyFallback: "Fallback body",
      }),
    );
  });
});
