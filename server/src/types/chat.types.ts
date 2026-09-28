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
    sources?: {
      projectName: string;
      sectionType: string;
    }[];
  };
}

export interface RelevantChunk {
  id: number;
  project_name: string;
  section_type: string;
  text: string;
  similarity: number;
}
