import { registerAs } from "@nestjs/config";

export const ragConfig = registerAs("rag", () => ({
  topK: Number(process.env.RAG_RETRIEVAL_TOP_K ?? 5),
  searchPath: process.env.INTERNAL_API_SEARCH_PATH ?? "/search",
}));
