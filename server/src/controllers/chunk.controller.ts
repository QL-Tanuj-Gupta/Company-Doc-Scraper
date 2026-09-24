import { Request, Response } from "express";
import {
  saveProjectChunks,
  splitProjectMarkdown,
} from "../services/chunk.service";

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

export const saveChunks = async (req: Request, res: Response) => {
  try {
    const { projectName, sectionType, text } = req.body;

    if (!projectName || !sectionType || !text) {
      return res.status(400).json({
        success: false,
        message: "projectName, sectionType and text are required",
      });
    }

    await saveProjectChunks(projectName, sectionType, text);

    return res.status(201).json({
      success: true,
      message: "Chunks saved successfully",
    });
  } catch (error) {
    console.error("Save chunks error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save chunks",
    });
  }
};
