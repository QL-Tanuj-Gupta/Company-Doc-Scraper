export const buildChatPrompt = (
  question: string,
  context: string,
  history: string,
) => {
  return `
You are a company project knowledge assistant.

Answer the user's question using only the provided project context and conversation history.

If the answer cannot be found in the provided context, clearly say that you do not have enough information.

Do not make up or assume information.

Conversation history:
${history}

Project context:
${context}

User question:
${question}

Answer:
`;
};
