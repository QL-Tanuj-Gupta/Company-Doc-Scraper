import crypto from "crypto";
import prisma from "../config/db";
import { generateEmbedding } from "./embedding.service";
import { RelevantChunk } from "../types/chat.types";

export const searchRelevantChunks = async (question: string) => {
  // Generate embeddings for users question
  const embedding = await generateEmbedding(question);

  // Convert embedding into vector format
  const vector = `[${embedding.join(",")}]`;

  // similar chunks findig
  const chunks = await prisma.$queryRaw<RelevantChunk[]>`
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

export const getOrCreateSession = async (sessionId?: string) => {
  // if sessionId was provided, try to find that session
  if (sessionId) {
    const existingSession = await prisma.chatSession.findUnique({
      where: {
        sessionId,
      },
    });

    if (existingSession) {
      return existingSession;
    }
  }

  const newSession = await prisma.chatSession.create({
    data: {
      sessionId: crypto.randomUUID(),
    },
  });
  return newSession;
};

export const saveMessage = async (
  sessionId: string,
  role: "user" | "assistant",
  content: string,
) => {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
  return message;
};

export const getSessionMessages = async (sessionId: string) => {
  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return messages;
};
