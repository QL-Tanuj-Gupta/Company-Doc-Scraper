import { MetadataMode, VectorStoreIndex } from "llamaindex";
import { vectorStore } from "../config/llamaindex";
import { generateAnswer } from "./llm.service";
import { RelevantChunk } from "../types/chat.types";

const TOP_K = 5;
const MIN_SIMILARITY = 0.3;

let index: Promise<VectorStoreIndex> | undefined;
const getIndex = () =>
  (index ??= VectorStoreIndex.fromVectorStore(vectorStore));

export const condenseQuestion = async (history: string, question: string) => {
  if (!history.trim()) return question;

  const rewritten = String(
    await generateAnswer(`Rewrite the follow-up question as a standalone question.
Replace words like "it", "they" or "this project" with the actual project name from the conversation.
If it is already standalone, return it unchanged. Return ONLY the question.

Conversation:
${history}

Follow-up question: ${question}

Standalone question:`),
  ).trim();

  return rewritten || question;
};

export const retrieveChunks = async (
  query: string,
): Promise<RelevantChunk[]> => {
  const retriever = (await getIndex()).asRetriever({ similarityTopK: TOP_K });
  const results = await retriever.retrieve(query);

  return results
    .filter(({ score }) => (score ?? 0) >= MIN_SIMILARITY)
    .map(({ node, score }) => ({
      projectName: String(node.metadata.projectName ?? "Unknown"),
      sectionType: String(node.metadata.Header_2 ?? "General"),
      text: node.getContent(MetadataMode.NONE),
      similarity: score ?? 0,
    }));
};
