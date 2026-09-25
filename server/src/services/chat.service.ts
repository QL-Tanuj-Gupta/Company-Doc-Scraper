import prisma from "../config/db";
import { generateEmbedding } from "./embedding.service";

export const searchRelevantChunks = async (question: string) => {
  // Generate embeddings for users question
  const embedding = await generateEmbedding(question);

  // Convert embedding into vector format
  const vector = `[${embedding.join(",")}]`;

  // similar chunks findig
  const chunks = await prisma.$queryRaw`
    SELECT
      id::integer AS id,
      project_name,
      section_type,
      text,
      1 - (embedding <=> ${vector}::vector) AS similarity
    FROM project_chunks
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 5
  `;

  return chunks;
};
