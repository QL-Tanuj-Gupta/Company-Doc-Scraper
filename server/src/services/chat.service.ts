import crypto from "crypto";
import prisma from "../config/db";

// Reuse the session if it exists, otherwise start a new one.
export const getOrCreateSession = async (sessionId?: string) => {
  const existing = sessionId
    ? await prisma.chatSession.findUnique({ where: { sessionId } })
    : null;

  return (
    existing ??
    prisma.chatSession.create({ data: { sessionId: crypto.randomUUID() } })
  );
};

export const saveMessage = (
  sessionId: string,
  role: "user" | "assistant",
  content: string,
) => prisma.chatMessage.create({ data: { sessionId, role, content } });

// Only the last few messages (oldest first) keep the prompt small and focused.
export const getSessionMessages = async (sessionId: string, limit = 6) => {
  const latest = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return latest.reverse();
};
