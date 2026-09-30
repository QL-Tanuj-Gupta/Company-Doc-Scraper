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
    contexts?: string[];
    sources?: {
      projectName: string;
      sectionType: string;
      text?: string;
      similarity?: number;
    }[];
  };
}

export interface RelevantChunk {
  projectName: string;
  sectionType: string;
  text: string;
  similarity: number;
}
