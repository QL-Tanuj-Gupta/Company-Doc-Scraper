import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  temperature: 0,
});

export const generateAnswer = async (prompt: string) => {
  const response = await llm.invoke(prompt);

  console.log("LLM response:", response.usage_metadata);

  return response.content;
};
