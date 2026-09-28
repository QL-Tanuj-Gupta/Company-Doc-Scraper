import prisma from "../config/db";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { generateEmbedding } from "./embedding.service";
import { ProjectChunkData } from "../types/project.types";

export const splitProjectMarkdown = async (
  markdown: string,
): Promise<ProjectChunkData[]> => {
  const sections = markdown
    .replace(/^\s*#\s+.*\n/m, "")
    .split(/^\s*##\s+/m)
    .filter(Boolean);

  const chunks: ProjectChunkData[] = [];

  for (const section of sections) {
    const lines = section.trim().split("\n");

    const sectionType = lines[0].trim();
    const text = lines.slice(1).join("\n").trim();

    if (!text) {
      continue; // Skip empty sections
    }

    const splitter = new MarkdownTextSplitter();
    const sectionChunks = await splitter.splitText(text);

    sectionChunks.forEach((chunk) => {
      chunks.push({
        sectionType,
        text: chunk,
      });
    });
  }

  return chunks;
};

export const saveProjectChunks = async (
  projectName: string,
  chunks: ProjectChunkData[],
) => {
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);

    const vector = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
    INSERT INTO project_chunks
    (project_name, section_type, text, embedding)
    VALUES
    (${projectName}, ${chunk.sectionType}, ${chunk.text}, ${vector}::vector)
  `;
  }
};
