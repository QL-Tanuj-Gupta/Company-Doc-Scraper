import { Request, Response } from "express";
import { splitProjectMarkdown } from "../services/chunk.service";

export const createChunks = async (req: Request, res: Response) => {
  try {
    const { markdown } = req.body;

    if (!markdown || typeof markdown !== "string") {
      return res.status(400).json({
        success: false,
        message: "Markdown is required",
      });
    }

    const chunks = await splitProjectMarkdown(markdown);

    return res.status(200).json({
      success: true,
      message: "Markdown split successfully",
      data: { chunks },
    });
  } catch (error) {
    console.error("Chunking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to split markdown",
    });
  }
};
