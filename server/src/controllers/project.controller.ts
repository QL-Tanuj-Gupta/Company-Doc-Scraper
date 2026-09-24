import { Request, Response } from "express";
import { CreateProjectInput } from "../types/project.types";
import {
  checkProjectExists,
  createProjectMarkdown,
} from "../services/project.service";

export const addProject = async (req: Request, res: Response) => {
  try {
    const {
      projectName,
      overview = null,
      technologies = null,
      team = null,
      features = null,
    } = req.body;

    if (!projectName || typeof projectName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    const project: CreateProjectInput = {
      projectName: projectName.trim(),
      overview,
      technologies,
      team,
      features,
    };

    const projectExists = await checkProjectExists(project.projectName);

    if (projectExists) {
      return res.status(409).json({
        success: false,
        message: "Project already exists",
      });
    }

    const markdown = createProjectMarkdown(project);

    return res.status(201).json({
      success: true,
      message: "Project prepared succesfully",
      data: {
        project,
        markdown,
      },
    });
  } catch (error) {
    console.error("Add project error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add project",
    });
  }
};
