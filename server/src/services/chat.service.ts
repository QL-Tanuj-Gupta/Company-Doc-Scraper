import crypto from "crypto";
import prisma from "../config/db";

export const getOrCreateSession = async (sessionId?: string) => {
  const existing = sessionId
    ? await prisma.chatSession.findUnique({ where: { sessionId } })
    : null;

  return (
    existing ??
    prisma.chatSession.create({
      data: {
        sessionId: crypto.randomUUID(),
      },
    })
  );
};

export const saveMessage = (
  sessionId: string,
  role: "user" | "assistant",
  content: string,
) => prisma.chatMessage.create({ data: { sessionId, role, content } });

// Only last few messages & keeping promt small
export const getSessionMessages = async (sessionId: string, limit = 6) => {
  const latest = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return latest.reverse();
};
