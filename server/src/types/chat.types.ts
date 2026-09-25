export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data?: {
    answer: string;
    sources?: {
      projectName: string;
      sectionType: string;
    }[];
  };
}
