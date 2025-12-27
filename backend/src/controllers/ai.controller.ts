import { Request, Response } from "express";
import { generateChatResponse } from "../utilts/ai.util";

export default async function ai(req: Request, res: Response) {
  try {
    const body = req.body;
    const files = (req as any).files as Express.Multer.File[] | undefined;

    const message = body.message as string;

    // parse chat history
    let history: ChatMessage[] = [];
    if (body.history) {
      try {
        history = typeof body.history === "string"
          ? JSON.parse(body.history)
          : body.history;
      } catch {
        history = [];
      }
    }

    // parse boolean flags from FormData for workday and quickbooks    
    const useWorkdayData = body.useWorkdayData === "true" || body.useWorkdayData === true;
    const useQuickbooksData = body.useQuickbooksData === "true" || body.useQuickbooksData === true;

    // validation of the message
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "",
        errorMessage: "Message is required",
      } as ChatResponse);
    }

    // get the file if uploaded
    const file =
      Array.isArray(files) && files.length > 0 ? files[0] : undefined;

    // headers for streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // streaming the response
    const stream = generateChatResponse(
      message,
      history,
      useWorkdayData,
      useQuickbooksData,
      file
        ? {
          buffer: file.buffer,
          mimeType: file.mimetype,
          originalname: file.originalname,
        }
        : undefined
    );

    for await (const { chunk, done, updatedHistory } of stream) {
      if (done) {
        // final event to the frontend with the updated history
        const finalData = JSON.stringify({
          done: true,
          history: updatedHistory,
        });
        res.write(`data: ${finalData}\n\n`);
      } else if (chunk) {
        // sending chunk
        const chunkData = JSON.stringify({
          done: false,
          chunk: chunk,
        });
        res.write(`data: ${chunkData}\n\n`);
      }
    }

    // ending the stream
    res.end();
  } catch (error) {
    console.log("🔴 Error in ai controller:", (error as Error).message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        data: null,
        message: "",
        errorMessage: (error as Error).message || "Something went wrong",
      } as ChatResponse);
    }

    const errorData = JSON.stringify({
      done: true,
      error: (error as Error).message || "Something went wrong",
    });
    res.write(`data: ${errorData}\n\n`);
    res.end();
  }
}

