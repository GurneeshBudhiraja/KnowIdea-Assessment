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
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { AppConnector, AppConnectorType } from "./HomePage";

interface ChatInterfaceProps {
  appConnectors: AppConnector[];
  onToggleConnector: (connectorType: AppConnectorType) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  file?: {
    name: string;
    size: number;
  };
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      content: "Hello, I'm KnowIdea AI. How can I help you today?",
      role: "user",
      id: "1",
    },
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async () => {
    if (!message.trim()) return;

    // update the state with the user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      file: uploadedFile
        ? { name: uploadedFile.name, size: uploadedFile.size }
        : undefined,
    };

    // logs the uploaded file details and the content
    if (uploadedFile) {
      console.log("Uploaded File:", {
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("File Contents:", e.target?.result);
      };
      reader.readAsText(uploadedFile);
    }

    setChatMessages((prev) => [...prev, userMessage]);

    // reset the input states
    setMessage("");
    setUploadedFile(null);
    setIsPlusMenuOpen(false);

    setIsAiTyping(true);

    // Simulate AI response after 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("AI Response: Hello World");

    // Add AI response
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Hello World",
    };

    setChatMessages((prev) => [...prev, aiMessage]);
    setIsAiTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
    <div className="h-full w-full flex flex-col">
      {/* chat messages */}
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
                className={`flex gap-3 items-end ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-white text-zinc-900"
                      : "bg-zinc-800 text-zinc-100 border border-zinc-700"
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
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-zinc-900" />
                  </div>
                )}
              </div>
            ))}

            {/* bot typing */}
            {isAiTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* file preview icon */}
      {uploadedFile && (
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

      {/* app connnectors display that would be included with the user query */}
      {activeConnectors.size > 0 && (
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
          {isPlusMenuOpen && (
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
            </div>
          )}

          {/* input */}
          <div className="flex items-end gap-2 bg-zinc-800/50 border border-zinc-700 rounded-2xl p-2">
            {/* plus button for the file upload */}
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

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask KnowIdea anything..."
              disabled={isAiTyping}
              rows={1}
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none text-sm py-2.5 px-1 max-h-32 scrollbar-auto-textarea disabled:opacity-50"
              style={{ minHeight: "40px" }}
            />

            {/* submit button */}
            <button
              onClick={handleSubmit}
              disabled={(!message.trim() && !uploadedFile) || isAiTyping}
              className={`p-2.5 rounded-xl transition-all ${
                (message.trim() || uploadedFile) && !isAiTyping
                  ? "bg-white text-zinc-900 hover:opacity-90"
                  : "bg-zinc-700/50 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
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
