import { API_ENDPOINTS } from "../constants";

// types to match with the backend api
export interface ChatPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  role: "user" | "model";
  parts: ChatPart[];
}

export interface StreamChunk {
  done: boolean;
  chunk?: string;
  history?: ChatMessage[];
  error?: string;
}

export interface SendMessageOptions {
  message: string;
  history: ChatMessage[];
  file?: File;
  useWorkdayData?: boolean;
  useQuickbooksData?: boolean;
  onChunk: (chunk: string) => void;
  onComplete: (history: ChatMessage[]) => void;
  onError: (error: string) => void;
}

/**
 * wrapper function to call the backend api
 */
export async function sendMessage({
  message,
  history,
  file,
  useWorkdayData = false,
  useQuickbooksData = false,
  onChunk,
  onComplete,
  onError,
}: SendMessageOptions): Promise<void> {
  try {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("history", JSON.stringify(history));
    formData.append("useWorkdayData", String(useWorkdayData));
    formData.append("useQuickbooksData", String(useQuickbooksData));

    if (file) {
      formData.append("file", file);
    }

    const response = await fetch(API_ENDPOINTS.AI, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.errorMessage || `HTTP error ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is not available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // handle SSE 
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data: StreamChunk = JSON.parse(line.slice(6));

            if (data.error) {
              onError(data.error);
              return;
            }

            if (data.done && data.history) {
              onComplete(data.history);
            } else if (data.chunk) {
              onChunk(data.chunk);
            }
          } catch (parseError) {
            console.error("Failed to parse SSE data:", parseError);
          }
        }
      }
    }

    // handle any remaining buffer
    if (buffer.startsWith("data: ")) {
      try {
        const data: StreamChunk = JSON.parse(buffer.slice(6));
        if (data.done && data.history) {
          onComplete(data.history);
        } else if (data.chunk) {
          onChunk(data.chunk);
        }
      } catch (parseError) {
        console.error("Failed to parse final SSE data:", parseError);
      }
    }
  } catch (error) {
    onError((error as Error).message || "Failed to send message");
  }
}

/**
 * helper function to get text content from the chat message
 */
export function getMessageText(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join("");
}

/**
 * helper function to check if a message has a file attachment
 */
export function messageHasFile(message: ChatMessage): boolean {
  return message.parts.some((part) => part.inlineData);
}

export interface ComposeEmailResponse {
  success: boolean;
  data: string | null;
  message: string;
  errorMessage: string;
}

/**
 * wrapper function to compose email
 */
export async function composeEmail(
  selectedMessage: string,
  userQuery?: string
): Promise<{ success: boolean; emailContent: string | null; error?: string }> {
  try {
    const response = await fetch(API_ENDPOINTS.COMPOSE_EMAIL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedMessage,
        userQuery: userQuery || "",
      }),
    });

    const data: ComposeEmailResponse = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        emailContent: null,
        error: data.errorMessage || `HTTP error ${response.status}`,
      };
    }

    return {
      success: true,
      emailContent: data.data,
    };
  } catch (error) {
    return {
      success: false,
      emailContent: null,
      error: (error as Error).message || "Failed to compose email",
    };
  }
}

