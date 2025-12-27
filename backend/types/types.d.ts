// Gemini API types
interface ChatPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface ChatMessage {
  role: "user" | "model";
  parts: ChatPart[];
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  systemInstruction?: string;
  useWorkdayData?: boolean;
  useQuickbooksData?: boolean;
}

interface ChatResponse {
  success: boolean;
  data: string | null;
  message: string;
  errorMessage: string;
  history?: ChatMessage[];
}

