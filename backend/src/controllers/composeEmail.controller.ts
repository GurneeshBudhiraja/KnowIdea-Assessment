import { Request, Response } from "express";
import { composeEmailContent } from "../utilts/ai.util";

interface ComposeEmailRequest {
  selectedMessage: string;
  userQuery?: string;
}

interface ComposeEmailResponse {
  success: boolean;
  data: string | null;
  message: string;
  errorMessage: string;
}

export default async function composeEmail(req: Request, res: Response) {
  try {
    const body = req.body as ComposeEmailRequest;

    const selectedMessage = body.selectedMessage;
    const userQuery = body.userQuery?.trim() || "";

    // validate the selected message
    if (!selectedMessage || typeof selectedMessage !== "string" || selectedMessage.trim() === "") {
      return res.status(400).json({
        success: false,
        data: null,
        message: "",
        errorMessage: "Selected message is required",
      } as ComposeEmailResponse);
    }

    console.log("📧 Compose Email Request:");
    console.log("  - Selected Message Length:", selectedMessage.length);
    console.log("  - User Query:", userQuery || "(none)");

    // generate the email content
    const emailContent = await composeEmailContent(selectedMessage, userQuery);

    if (!emailContent) {
      return res.status(500).json({
        success: false,
        data: null,
        message: "",
        errorMessage: "Failed to generate email content",
      } as ComposeEmailResponse);
    }

    console.log("✅ Email content generated successfully");

    return res.status(200).json({
      success: true,
      data: emailContent,
      message: "Email content generated successfully",
      errorMessage: "",
    } as ComposeEmailResponse);
  } catch (error) {
    console.log("🔴 Error in composeEmail controller:", (error as Error).message);
    return res.status(500).json({
      success: false,
      data: null,
      message: "",
      errorMessage: (error as Error).message || "Something went wrong",
    } as ComposeEmailResponse);
  }
}

