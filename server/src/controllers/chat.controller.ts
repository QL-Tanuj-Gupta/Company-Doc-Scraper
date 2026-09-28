import { Request, Response } from "express";
import { ChatRequest } from "../types/chat.types";

import {
  getOrCreateSession,
  getSessionMessages,
  saveMessage,
  searchRelevantChunks,
} from "../services/chat.service";

import { buildChatPrompt } from "../services/prompt.service";

import { generateAnswer } from "../services/llm.service";

export const chat = async (req: Request, res: Response) => {
  try {
    const { sessionId, question }: ChatRequest = req.body;

    // validate question
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const cleanQuestion = question.trim();

    const session = await getOrCreateSession(sessionId);

    const messages = await getSessionMessages(session.sessionId);

    await saveMessage(session.sessionId, "user", cleanQuestion);

    const chunks = await searchRelevantChunks(cleanQuestion);

    const history = messages
      .map((message) => {
        return `${message.role}: ${message.content}`;
      })
      .join("\n");

    const context = chunks
      .map(
        (chunk) => `Project: ${chunk.project_name}
    Section: ${chunk.section_type}
    Content: ${chunk.text}`,
      )
      .join("\n\n");

    const prompt = buildChatPrompt(cleanQuestion, context, history);

    const answer = await generateAnswer(prompt);

    await saveMessage(session.sessionId, "assistant", String(answer));

    return res.status(200).json({
      success: true,
      message: "Answer generated successfully.",
      data: {
        sessionId: session.sessionId,
        answer: String(answer),
        sources: chunks.map((chunk) => ({
          projectName: chunk.project_name,
          sectionType: chunk.section_type,
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
