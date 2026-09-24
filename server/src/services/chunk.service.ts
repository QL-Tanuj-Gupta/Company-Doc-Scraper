import { MarkdownTextSplitter } from "@langchain/textsplitters";

export const splitProjectMarkdown = async (markdown: string) => {
  const splitter = new MarkdownTextSplitter();

  return await splitter.splitText(markdown);
};
