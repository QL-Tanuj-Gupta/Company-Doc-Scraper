export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  sessionId?: string;
  question: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: {
    sessionId: string;
    answer: string;
  };
}
