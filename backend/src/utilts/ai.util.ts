import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { COMPOSE_EMAIL_SYSTEM_INSTRUCTION, GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";
import { getQuickbooksData, getWorkdayData } from "../controllers/mockData.controller";

let aiClient: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const AI_API_KEY = process.env.GEMINI_API_KEY;
    if (!AI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    aiClient = new GoogleGenAI({
      apiKey: AI_API_KEY,
    });
  }
  return aiClient;
}

// wrapper function for the user messages for the Gemini API
function buildUserParts(
  message: string,
  file?: { buffer: Buffer; mimeType: string; originalname: string }
): ChatPart[] {
  const userParts: ChatPart[] = [];

  if (file) {
    userParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.buffer.toString("base64"),
      },
    });
  }

  userParts.push({ text: message });
  return userParts;
}


// makes the actual api call to the Gemini API
export async function* generateChatResponse(
  message: string,
  history: ChatMessage[] = [],
  useWorkdayData: boolean = false,
  useQuickbooksData: boolean = false,
  file?: { buffer: Buffer; mimeType: string; originalname: string }
): AsyncGenerator<{ chunk: string; done: boolean; updatedHistory?: ChatMessage[] }> {
  const ai = getAIClient();

  let workdayData: any[] = []
  let quickbooksData: any[] = []

  // mimicing workday data
  if (useWorkdayData) {
    workdayData = getWorkdayData();
  }

  // mimicking the quickbooks data
  if (useQuickbooksData) {
    quickbooksData = getQuickbooksData();
  }

  // creates a new user message with the data from the connectors
  let augmentedMessage = message;
  if (useWorkdayData && workdayData && workdayData.length > 0) {
    console.log("Adding workday data to the user message");
    console.log(workdayData.length);
    augmentedMessage += `\n\n<workday_data>${JSON.stringify(workdayData)}</workday_data>`;
  }
  if (useQuickbooksData && quickbooksData && quickbooksData.length > 0) {
    console.log("Adding quickbooks data to the user message");
    augmentedMessage += `\n\n<quickbooks_data>${JSON.stringify(quickbooksData)}</quickbooks_data>`;
  }

  const augmentedUserParts = buildUserParts(augmentedMessage, file);
  const augmentedUserMessage: ChatMessage = {
    role: "user",
    parts: augmentedUserParts,
  };

  // this is for the history
  const cleanUserParts = buildUserParts(message, file);
  const cleanUserMessage: ChatMessage = {
    role: "user",
    parts: cleanUserParts,
  };

  const contentsForApi = [...history, augmentedUserMessage];

  const contentsForHistory = [...history, cleanUserMessage];

  const response = await ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: contentsForApi,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MEDIUM
      }
    }
  });

  let fullText = "";

  for await (const chunk of response) {
    const chunkText = chunk.text ?? "";
    fullText += chunkText;
    yield { chunk: chunkText, done: false };
  }

  const modelMessage: ChatMessage = {
    role: "model",
    parts: [{ text: fullText }],
  };

  yield {
    chunk: "",
    done: true,
    updatedHistory: [...contentsForHistory, modelMessage],
  };
}




// composes the email content
export async function composeEmailContent(
  selectedMessage: string,
  userQuery: string = ""
): Promise<string | null> {
  try {
    const ai = getAIClient();

    let prompt = `<content_to_format>\n${selectedMessage}\n</content_to_format>`;

    if (userQuery) {
      prompt += `\n\n<user_instructions>\n${userQuery}\n</user_instructions>`;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [prompt],
      config: {
        systemInstruction: COMPOSE_EMAIL_SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const emailContent = response.text ?? null;
    return emailContent;
  } catch (error) {
    console.log("🔴 Error in composeEmailContent:", (error as Error).message);
    return null;
  }
}