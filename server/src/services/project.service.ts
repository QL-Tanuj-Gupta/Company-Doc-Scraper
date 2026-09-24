import prisma from "../config/db";
import { CreateProjectInput } from "../types/project.types";

export const checkProjectExists = async (
  projectName: string,
): Promise<boolean> => {
  const existingProject = await prisma.projectChunk.findFirst({
    where: {
      projectName: {
        equals: projectName.trim(),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  return existingProject !== null;
};

export const createProjectMarkdown = (project: CreateProjectInput): string => {
  const technologies = project.technologies
    ? project.technologies.map((technology) => `- ${technology}`).join("\n")
    : "";

  const team = project.team
    ? project.team.map((member) => `- ${member}`).join("\n")
    : "";

  const features = project.features
    ? project.features.map((feature) => `- ${feature}`).join("\n")
    : "";

  return `
  # ${project.projectName}

  ## Overview

  ${project.overview ?? ""}

  ## Technologies

  ${technologies}

  ## Team

  ${team}

  ## Features

  ${features}

`;
};
