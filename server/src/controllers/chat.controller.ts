import { Request, Response } from "express";
import { ChatRequest } from "../types/chat.types";

import {
  getOrCreateSession,
  getSessionMessages,
  saveMessage,
} from "../services/chat.service";
import { condenseQuestion, retrieveChunks } from "../services/rag.service";
import { buildChatPrompt } from "../services/prompt.service";
import { generateAnswer } from "../services/llm.service";

export const chat = async (req: Request, res: Response) => {
  try {
    const { sessionId, question } = req.body as ChatRequest;

    if (typeof question !== "string" || !question.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required." });
    }

    const cleanQuestion = question.trim();
    const session = await getOrCreateSession(sessionId);

    // Load history first, so the new question isn't counted twice.
    const previous = await getSessionMessages(session.sessionId);
    await saveMessage(session.sessionId, "user", cleanQuestion);

    const history = previous.map((m) => `${m.role}: ${m.content}`).join("\n");

    // 1) rewrite follow-ups  2) retrieve chunks  3) generate the answer
    const searchQuestion = await condenseQuestion(history, cleanQuestion);
    const chunks = await retrieveChunks(searchQuestion);

    const context = chunks
      .map(
        (c) =>
          `Project: ${c.projectName}\nSection: ${c.sectionType}\nContent: ${c.text}`,
      )
      .join("\n\n");

    const answer = String(
      await generateAnswer(buildChatPrompt(cleanQuestion, context, history)),
    );
    await saveMessage(session.sessionId, "assistant", answer);

    return res.status(200).json({
      success: true,
      message: "Answer generated successfully.",
      data: {
        sessionId: session.sessionId,
        answer,
        contexts: chunks.map((c) => c.text),
        sources: chunks.map(({ projectName, sectionType, text, similarity }) => ({
          projectName,
          sectionType,
          text,
          similarity: Number(similarity.toFixed(3)),
        })),
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process question" });
  }
};
