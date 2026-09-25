import { Request, Response } from "express";
import { ChatRequest } from "../types/chat.types";
import { searchRelevantChunks } from "../services/chat.service";

export const chat = async (req: Request, res: Response) => {
  try {
    const { question }: ChatRequest = req.body;

    // validate question
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const chunks = await searchRelevantChunks(question.trim());

    return res.status(200).json({
      success: true,
      message: "Question received successfully",
      data: {
        question: question.trim(),
        chunks,
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
