import {
  Send,
  Plus,
  X,
  FileText,
  File,
  ToggleLeft,
  ToggleRight,
  Upload,
  Bot,
  User,
  Mail,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { AppConnector, AppConnectorType } from "./HomePage";
import MarkdownRenderer from "../components/MarkdownRenderer";
import {
  sendMessage,
  composeEmail,
  ChatMessage as APIChatMessage,
} from "../services/api.service";

interface ChatInterfaceProps {
  appConnectors: AppConnector[];
  onToggleConnector: (connectorType: AppConnectorType) => void;
}

// UI message type (for display)
interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  file?: {
    name: string;
    size: number;
  };
}

// Email mode state
interface EmailModeState {
  isActive: boolean;
  selectedMessageId: string | null;
  selectedMessageContent: string | null;
}

const ALLOWED_FILE_TYPES = [".txt", ".md", ".json", ".csv"];
const ALLOWED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
];

function ChatInterface({
  appConnectors,
  onToggleConnector,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeConnectors, setActiveConnectors] = useState<
    Set<AppConnectorType>
  >(new Set());
  const [chatMessages, setChatMessages] = useState<UIMessage[]>([]);
  const [apiHistory, setApiHistory] = useState<APIChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailModeState>({
    isActive: false,
    selectedMessageId: null,
    selectedMessageContent: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const connectedApps = appConnectors.filter((c) => c.isConnected);

  useEffect(() => {
    const connected = appConnectors.filter((c) => c.isConnected);
    const connectedAppTypes = new Set(connected.map((app) => app.name));
    setActiveConnectors(connectedAppTypes);
  }, [appConnectors]);

  // scrolls to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isAiTyping]);

  const handleEmailClick = (messageId: string, messageContent: string) => {
    setEmailMode({
      isActive: true,
      selectedMessageId: messageId,
      selectedMessageContent: messageContent,
    });
    setMessage("");
  };

  const handleCancelEmailMode = () => {
    setEmailMode({
      isActive: false,
      selectedMessageId: null,
      selectedMessageContent: null,
    });
    setMessage("");
  };

  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    content: string;
    error?: string;
  } | null>(null);

  const handleEmailSubmit = async () => {
    if (!emailMode.selectedMessageContent) return;

    const emailQuery = message.trim();

    console.log("📧 Email Request:");
    console.log(
      "  - Selected Message Length:",
      emailMode.selectedMessageContent.length
    );
    console.log("  - User Query:", emailQuery || "(none provided)");

    setIsComposingEmail(true);

    const result = await composeEmail(
      emailMode.selectedMessageContent,
      emailQuery
    );

    setIsComposingEmail(false);

    if (result.success && result.emailContent) {
      console.log("✅ Email composed successfully");
      setEmailResult({
        success: true,
        content: result.emailContent,
      });
    } else {
      console.log("🔴 Email composition failed:", result.error);
      setEmailResult({
        success: false,
        content: "",
        error: result.error || "Failed to compose email",
      });
    }

    // resets the state
    setEmailMode({
      isActive: false,
      selectedMessageId: null,
      selectedMessageContent: null,
    });
    setMessage("");
  };

  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyEmailContent = async () => {
    if (emailResult?.content) {
      try {
        await navigator.clipboard.writeText(emailResult.content);
        console.log("📋 Email content copied to clipboard");
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const handleCloseEmailResult = () => {
    setEmailResult(null);
  };

  const handleSubmit = async () => {
    if (emailMode.isActive) {
      handleEmailSubmit();
      return;
    }

    if (!message.trim() && !uploadedFile) return;

    const currentMessage = message.trim();
    const currentFile = uploadedFile;

    // user message to show in the UI
    const userMessageId = Date.now().toString();
    const userMessage: UIMessage = {
      id: userMessageId,
      role: "user",
      content: currentMessage,
      file: currentFile
        ? { name: currentFile.name, size: currentFile.size }
        : undefined,
    };

    setChatMessages((prev) => [...prev, userMessage]);

    // reset states
    setMessage("");
    setUploadedFile(null);
    setIsPlusMenuOpen(false);
    setIsAiTyping(true);

    // aiResponse to show in the UI
    const aiMessageId = (Date.now() + 1).toString();
    streamingMessageIdRef.current = aiMessageId;

    const aiMessage: UIMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setChatMessages((prev) => [...prev, aiMessage]);

    // getting the active connnectors for the api call
    const useWorkdayData = activeConnectors.has(AppConnectorType.WORKDAY);
    const useQuickbooksData = activeConnectors.has(AppConnectorType.QUICKBOOKS);

    // abstraction to send message to the backend
    await sendMessage({
      message: currentMessage,
      history: apiHistory,
      file: currentFile || undefined,
      useWorkdayData,
      useQuickbooksData,
      onChunk: (chunk) => {
        // add chunks to the streaming message
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      },
      onComplete: (history) => {
        setApiHistory(history);
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
          )
        );

        setIsAiTyping(false);
        streamingMessageIdRef.current = null;
      },
      onError: (error) => {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: `Error: ${error}`,
                  isStreaming: false,
                }
              : msg
          )
        );

        setIsAiTyping(false);
        streamingMessageIdRef.current = null;
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // cancel email mode on the click of the escape key
    if (e.key === "Escape" && emailMode.isActive) {
      handleCancelEmailMode();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (
        ALLOWED_FILE_TYPES.includes(fileExtension) ||
        ALLOWED_MIME_TYPES.includes(file.type)
      ) {
        setUploadedFile(file);
        setIsPlusMenuOpen(false);
      } else {
        alert("Only .txt, .md, .json, and .csv files are allowed.");
      }
    }

    // file input state reset
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const toggleConnectorActive = (connectorType: AppConnectorType) => {
    setActiveConnectors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(connectorType)) {
        newSet.delete(connectorType);
      } else {
        newSet.add(connectorType);
      }
      return newSet;
    });
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setApiHistory([]);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "json":
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case "md":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "csv":
        return <FileText className="w-4 h-4 text-green-400" />;
      default:
        return <File className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getConnectorDisplayName = (type: AppConnectorType) => {
    switch (type) {
      case AppConnectorType.WORKDAY:
        return "Workday";
      case AppConnectorType.QUICKBOOKS:
        return "QuickBooks";
      default:
        return type;
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative">
      {/* modal to show the generated email */}
      {emailResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-zinc-100">
                  {emailResult.success ? "Email Content Ready" : "Error"}
                </span>
              </div>
              <button
                onClick={handleCloseEmailResult}
                className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-100" />
              </button>
            </div>
            <div className="p-4">
              {emailResult.success ? (
                <>
                  <div className="max-h-64 overflow-y-auto scrollbar-auto bg-zinc-800 border border-zinc-700 rounded-lg p-3 mb-4">
                    <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-theme-ibm-mono">
                      {emailResult.content}
                    </pre>
                  </div>
                  <button
                    onClick={handleCopyEmailContent}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                      hasCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-400 text-sm">{emailResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isComposingEmail && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 px-6 py-4 bg-zinc-900 border border-zinc-700 rounded-xl">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-sm text-zinc-300">Composing email...</span>
          </div>
        </div>
      )}

      {/* shows all the chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 scrollbar-auto p-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 text-sm">
            <p className="mb-2 text-base text-zinc-100">
              Start a conversation with KnowIdea AI
            </p>
            <p className="text-sm text-zinc-400">
              Type your message below or attach a file
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-white text-zinc-900"
                        : "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    } ${
                      emailMode.isActive &&
                      emailMode.selectedMessageId === msg.id
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    {msg.file && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-600/50">
                        {getFileIcon(msg.file.name)}
                        <span className="text-xs font-theme-ibm-mono truncate">
                          {msg.file.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({formatFileSize(msg.file.size)})
                        </span>
                      </div>
                    )}
                    {msg.role === "assistant" ? (
                      <div className="text-sm">
                        {msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : msg.isStreaming ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                          </div>
                        ) : null}
                        {msg.isStreaming && msg.content && (
                          <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle"></span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* email button to show below the assistant messages */}
                  {msg.role === "assistant" &&
                    !msg.isStreaming &&
                    msg.content &&
                    !msg.content.startsWith("Error:") && (
                      <button
                        onClick={() => handleEmailClick(msg.id, msg.content)}
                        disabled={emailMode.isActive || isAiTyping}
                        className={`self-start flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all ${
                          emailMode.isActive || isAiTyping
                            ? "bg-zinc-700/30 text-zinc-500 cursor-not-allowed"
                            : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/30"
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>
                    )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-zinc-900" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* file preview icon */}
      {uploadedFile && !emailMode.isActive && (
        <div className="mx-4 mb-2">
          <div className="flex items-center gap-3 p-3 bg-zinc-800/80 border border-zinc-700 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-zinc-700 rounded-lg">
              {getFileIcon(uploadedFile.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-zinc-400 font-theme-ibm-mono">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1.5 hover:bg-zinc-700 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400 hover:text-zinc-100" />
            </button>
          </div>
        </div>
      )}

      {/* email mode indicator */}
      {emailMode.isActive && (
        <div className="mx-4 mb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 flex-1">
              Compose email instructions (optional)
            </span>
            <button
              onClick={handleCancelEmailMode}
              className="p-1 hover:bg-blue-600/30 rounded transition-colors"
            >
              <X className="w-4 h-4 text-blue-400 hover:text-blue-300" />
            </button>
          </div>
        </div>
      )}

      {/* shows the active connectors */}
      {activeConnectors.size > 0 && !emailMode.isActive && (
        <div className="mx-4 mb-2 flex flex-wrap gap-2">
          {Array.from(activeConnectors).map((connectorType) => (
            <div
              key={connectorType}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 border border-emerald-600/30 rounded-full text-xs text-emerald-400"
            >
              <span className="font-theme-ibm-mono">
                {getConnectorDisplayName(connectorType)}
              </span>
              <button
                onClick={() => toggleConnectorActive(connectorType)}
                className="hover:text-emerald-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* chat area */}
      <div className="p-4 border-t border-zinc-800">
        <div className="relative">
          {/* menu for the file upload and the connected apps */}
          {isPlusMenuOpen && !emailMode.isActive && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-10">
              {connectedApps.length > 0 && (
                <div className="p-2 border-b border-zinc-700">
                  <p className="text-xs text-zinc-500 px-2 py-1 font-theme-ibm-mono uppercase tracking-wider">
                    Connected Apps
                  </p>
                  {connectedApps.map((connector) => {
                    const isActive = activeConnectors.has(connector.name);
                    return (
                      <button
                        key={connector.name}
                        onClick={() => toggleConnectorActive(connector.name)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <span className="text-sm text-zinc-100">
                          {getConnectorDisplayName(connector.name)}
                        </span>
                        {isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-zinc-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* file upload */}
              <div className="p-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4 text-zinc-400" />
                  <div className="text-left">
                    <span className="text-sm text-zinc-100">Add file</span>
                    <p className="text-xs text-zinc-500 font-theme-ibm-mono">
                      .txt, .md, .json, .csv
                    </p>
                  </div>
                </button>
              </div>

              {/* clear chat option */}
              {chatMessages.length > 0 && (
                <div className="p-2 border-t border-zinc-700">
                  <button
                    onClick={() => {
                      handleClearChat();
                      setIsPlusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">Clear conversation</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* input */}
          <div
            className={`flex items-end gap-2 rounded-2xl p-2 ${
              emailMode.isActive
                ? "bg-blue-900/20 border border-blue-600/30"
                : "bg-zinc-800/50 border border-zinc-700"
            }`}
          >
            {/* plus button - hidden in email mode */}
            {!emailMode.isActive && (
              <button
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                disabled={isAiTyping}
                className={`p-2.5 rounded-xl transition-all ${
                  isPlusMenuOpen
                    ? "bg-zinc-700 text-zinc-100"
                    : "hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-100"
                } ${isAiTyping ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Plus
                  className={`w-5 h-5 transition-transform ${
                    isPlusMenuOpen ? "rotate-45" : ""
                  }`}
                />
              </button>
            )}

            {/* email mode icon indicator */}
            {emailMode.isActive && (
              <div className="p-2.5 rounded-xl bg-blue-600/20">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                emailMode.isActive
                  ? "Add instructions for the email (or press Send to use as-is)..."
                  : "Ask KnowIdea anything..."
              }
              disabled={isAiTyping}
              rows={1}
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none text-sm py-2.5 px-1 max-h-32 scrollbar-auto-textarea disabled:opacity-50"
              style={{ minHeight: "40px" }}
            />

            {/* submit button */}
            <button
              onClick={handleSubmit}
              disabled={
                emailMode.isActive
                  ? false
                  : (!message.trim() && !uploadedFile) || isAiTyping
              }
              className={`p-2.5 rounded-xl transition-all ${
                emailMode.isActive
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : (message.trim() || uploadedFile) && !isAiTyping
                  ? "bg-white text-zinc-900 hover:opacity-90"
                  : "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {emailMode.isActive ? (
                <Mail className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
