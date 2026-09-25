import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  outputDimensionality: 768,
});

export const generateEmbedding = async (text: string): Promise<number[]> => {
  return await embeddings.embedQuery(text);
};
