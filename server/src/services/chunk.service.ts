import {
  Document,
  MarkdownNodeParser,
  VectorStoreIndex,
  storageContextFromDefaults,
} from "llamaindex";
import { vectorStore } from "../config/llamaindex";

// Splits by headings, so each chunk is one "## section" of one project.
const markdownParser = new MarkdownNodeParser();

export const indexProjectWithLlamaIndex = async (
  projectName: string,
  markdown: string,
) => {
  // projectName is copied onto every chunk
  const document = new Document({ text: markdown, metadata: { projectName } });

  // dont take header_1 content(#title)
  const nodes = markdownParser
    .getNodesFromDocuments([document])
    .filter((node) => node.metadata.Header_2);

  const storageContext = await storageContextFromDefaults({ vectorStore });
  return VectorStoreIndex.init({ nodes, storageContext });
};
