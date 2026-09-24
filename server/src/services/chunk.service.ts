import prisma from "../config/db";
import { MarkdownTextSplitter } from "@langchain/textsplitters";

export const splitProjectMarkdown = async (markdown: string) => {
  const splitter = new MarkdownTextSplitter();

  return await splitter.splitText(markdown);
};

export const saveProjectChunks = async (
  projectName: string,
  sectionType: string,
  text: string,
) => {
  await prisma.$executeRaw`
    INSERT INTO project_chunks
      (project_name, section_type, text)
    VALUES
      (${projectName}, ${sectionType}, ${text})
  `;
};
