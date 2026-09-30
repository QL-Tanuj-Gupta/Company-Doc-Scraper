import "dotenv/config";

import { BaseEmbedding, Settings } from "llamaindex";
import { PGVectorStore } from "@llamaindex/postgres";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const EMBEDDING_DIMENSIONS = 768;
export const VECTOR_SCHEMA = "public";
export const VECTOR_TABLE = "project_vectors";

class GeminiEmbedding extends BaseEmbedding {
  private model = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  constructor() {
    super(); // BaseEmbedding's constructor is protected, so we must expose one
  }

  async getTextEmbedding(text: string) {
    return this.model.embedQuery(text);
  }
}

Settings.embedModel = new GeminiEmbedding();

export const vectorStore = new PGVectorStore({
  clientConfig: { connectionString: process.env.DATABASE_URL! },
  schemaName: VECTOR_SCHEMA,
  tableName: VECTOR_TABLE,
  dimensions: EMBEDDING_DIMENSIONS,
});
