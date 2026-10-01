import { Request, Response } from "express";
import { ChatRequest } from "../types/chat.types";

import {
  getOrCreateSession,
  getSessionMessages,
  saveMessage,
} from "../services/chat.service";

import { buildChatPrompt } from "../services/prompt.service";
import { generateAnswer } from "../services/llm.service";
import { condenceQuestion, retrieveChunks } from "../services/rag.service";

export const chat = async (req: Request, res: Response) => {
  try {
    const { sessionId, question } = req.body as ChatRequest;

    // validate question
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "Question is required." });
    }

    const cleanQuestion = question.trim();

    const session = await getOrCreateSession(sessionId);

    // loading history to prevent new question duplication
    const previousMessages = await getSessionMessages(session.sessionId);
    await saveMessage(session.sessionId, "user", cleanQuestion);

    const history = previousMessages
      .map((message) => {
        return `${message.role}: ${message.content}`;
      })
      .join("\n");

    // rewrite followup question
    const searchQuestion = await condenceQuestion(history, cleanQuestion);

    // retrievechunks
    const chunks = await retrieveChunks(searchQuestion);

    const context = chunks
      .map(
        (chunk) =>
          `Project: ${chunk.projectName}\nSection: ${chunk.sectionType}\nContent: ${chunk.text}`,
      )
      .join("\n\n");

    // generate answer
    const prompt = buildChatPrompt(cleanQuestion, context, history);
    const answer = await generateAnswer(prompt);

    await saveMessage(session.sessionId, "assistant", String(answer));

    return res.status(200).json({
      success: true,
      message: "Answer generated successfully.",
      data: {
        sessionId: session.sessionId,
        answer,
        sources: chunks.map(({ projectName, sectionType, similarity }) => ({
          projectName,
          sectionType,
          similarity: Number(similarity.toFixed(3)),
        })),
      },
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process question",
    });
  }
};
