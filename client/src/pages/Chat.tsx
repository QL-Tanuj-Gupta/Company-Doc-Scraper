import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
} from "../types/chat.types";

const Chat = () => {
  // Stores the current chat session
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Stores the text currently entered by the user
  const [question, setQuestion] = useState("");

  // Stores all messages shown in the chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Shows loading state while waiting for backend
  const [loading, setLoading] = useState(false);

  // Reference to the bottom of the chat messages
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Send question to backend
  const handleSend = async () => {
    const cleanQuestion = question.trim();

    // Don't send empty questions
    if (!cleanQuestion || loading) {
      return;
    }

    // Add user's message immediately to the UI
    const userMessage: ChatMessage = {
      role: "user",
      content: cleanQuestion,
    };

    setMessages((previousMessages) => [...previousMessages, userMessage]);

    // Clear input
    setQuestion("");

    try {
      setLoading(true);

      const requestData: ChatRequest = {
        question: cleanQuestion,
        ...(sessionId && { sessionId }),
      };

      // Send request to backend
      const response = await axios.post<ChatResponse>(
        "http://localhost:5000/api/chat",
        requestData,
      );

      const data = response.data;

      if (!data.success || !data.data) {
        throw new Error(data.message || "Failed to get answer.");
      }

      // Store session ID returned by backend
      setSessionId(data.data.sessionId);

      // Add assistant response to UI
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.data.answer,
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      // Show error inside chat
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Something went wrong. Please try again.",
      };

      setMessages((previousMessages) => [...previousMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Start a new conversation
  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setQuestion("");
  };

  // Send message when Enter is pressed
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-50">
      {/* Chat action bar */}
      <div className="flex shrink-0 justify-end px-6 py-3">
        <button
          type="button"
          onClick={handleNewChat}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          New Chat
        </button>
      </div>
      {/* Chat messages */}
      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8 scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                How can I help?
              </h2>

              <p className="mt-2 max-w-md text-gray-500">
                Ask me about company projects, technologies, features, or team
                information.
              </p>
            </div>
          )}
          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-5 py-3 ${
                  message.role === "user"
                    ? "bg-black text-white"
                    : "border border-gray-200 bg-white text-gray-900"
                }`}
              >
                {message.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>
                ) : (
                  <div className="text-sm leading-6">
                    <ReactMarkdown
                      components={{
                        ul: ({ children }) => (
                          <ul className="my-2 list-disc space-y-1 pl-6">
                            {children}
                          </ul>
                        ),

                        ol: ({ children }) => (
                          <ol className="my-2 list-decimal space-y-1 pl-6">
                            {children}
                          </ol>
                        ),

                        li: ({ children }) => (
                          <li className="pl-1">{children}</li>
                        ),

                        p: ({ children }) => <p className="my-2">{children}</p>,

                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-3">
                <p className="text-sm text-gray-500">Thinking...</p>
              </div>
            </div>
          )}
          {/* Auto-scroll target */}
          <div ref={messagesEndRef} />
        </div>
      </main>
      {/* Input */}
      <footer className="shrink-0 border-t bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-end gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about company projects..."
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black disabled:bg-gray-100"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!question.trim() || loading}
            className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        <p className="mx-auto mt-2 max-w-4xl text-xs text-gray-400">
          Press Enter to send · Shift + Enter for a new line
        </p>
      </footer>
    </div>
  );
};

export default Chat;
