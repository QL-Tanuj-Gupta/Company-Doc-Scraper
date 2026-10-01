import {
  Document,
  MarkdownNodeParser,
  VectorStoreIndex,
  storageContextFromDefaults,
} from "llamaindex";
import { vectorStore } from "../config/llamaindex";

// Splits by headings, so each chunk is one "## section" of one project.
const markdownParser = new MarkdownNodeParser();

export const indexProjectWithLlamaindex = async (
  projectName: string,
  markdown: string,
) => {
  // project name is copied into every chunk
  const document = new Document({ text: markdown, metadata: { projectName } });

  const nodes = markdownParser
    .getNodesFromDocuments([document])
    .filter((node) => node.metadata.Header_2);

  const storageContext = await storageContextFromDefaults({ vectorStore });

  return VectorStoreIndex.init({ nodes, storageContext });
};
