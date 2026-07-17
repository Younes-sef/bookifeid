"use client";

/**
 * ChatClient — The main chat UI with session persistence
 *
 * HOW SESSION SAVING WORKS:
 *   1. The user sends a message → `sendMessage()` is called
 *   2. The AI SDK streams back a response; `status` goes 'submitted' → 'streaming' → 'idle'
 *   3. We watch `status` with a useEffect. When it transitions FROM 'streaming' TO 'idle',
 *      we know the AI has finished. We then call `upsertChatSession()`.
 *   4. On first save (no sessionId yet): the server action creates a new session and
 *      returns its ID. We store that in `activeSessionId` state and push it into the URL
 *      so the sidebar can highlight it.
 *   5. On subsequent saves: we update the existing session's messages.
 *
 * WHY NOT SAVE ON EVERY KEYSTROKE OR MESSAGE SEND?
 *   We only save when the AI finishes (status returns to 'idle') so we always save
 *   complete question+answer pairs. Saving on user send would give us dangling user
 *   messages with no AI response.
 *
 * MESSAGE FORMAT CONVERSION:
 *   AI SDK stores messages as UIMessage { parts: [{type:'text', text:'...'}] }
 *   MongoDB stores them as { role, content } plain strings.
 *   We convert in both directions here.
 */

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Send, User, Bot } from "lucide-react";
import ChatMessageSkeleton from "@/components/ChatMessageSkeleton";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { upsertChatSession } from "@/lib/action/chat.actions";
import type { SerializedChatMessage } from "@/lib/action/chat.actions";

interface ChatClientProps {
  bookId: string;
  bookSlug: string;
  title: string;
  /** If a session was loaded from the URL, its ID is passed here */
  initialSessionId?: string;
  /** Pre-loaded messages from a saved session */
  initialMessages?: SerializedChatMessage[];
}

/**
 * Converts saved DB messages (plain {role, content}) back into the UIMessage
 * format that the AI SDK expects for its `messages` initializer.
 */
function toUIMessages(saved: SerializedChatMessage[]): UIMessage[] {
  return saved.map((msg, i) => ({
    id: `saved-${i}`,
    role: msg.role,
    parts: [{ type: "text" as const, text: msg.content }],
  }));
}

/**
 * Extracts plain text from a UIMessage's parts array.
 * UIMessage uses parts for multimodal support; we only care about text.
 */
function extractText(msg: UIMessage): string {
  const part = msg.parts?.find((p) => p.type === "text");
  return (part as any)?.text ?? "";
}

export default function ChatClient({
  bookId,
  bookSlug,
  title,
  initialSessionId,
  initialMessages = [],
}: ChatClientProps) {
  const router = useRouter();

  // The welcome message shown at the top of every new chat.
  // It's NOT saved to MongoDB — it's always generated fresh.
  const welcomeMessage: UIMessage = {
    id: "welcome-msg",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: `Hello! I'm ready to discuss "${title}" with you. What would you like to know?`,
      },
    ],
  };

  // Build the initial messages array:
  // - Always start with the welcome message
  // - Append any saved messages from the loaded session (if any)
  const startingMessages: UIMessage[] = [
    welcomeMessage,
    ...toUIMessages(initialMessages),
  ];

  const [input, setInput] = useState("");
  // Track which session we're in — null means this is a brand new unsaved session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId ?? null
  );

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: { "x-book-id": bookId },
      body: {
        sessionId: activeSessionId,
      },
    }),
    messages: startingMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── Auto-save after each AI response ─────────────────────────────────────
  // We use a ref to track the previous status so we can detect the exact
  // moment the status transitions from 'streaming' → 'idle'.
  // A ref (not state) is used so this doesn't cause extra renders.
  const prevStatus = useRef(status);
  useEffect(() => {
    const wasStreaming = prevStatus.current === "streaming";
    const isNowIdle = status !== "streaming" && status !== "submitted";

    if (wasStreaming && isNowIdle) {
      // The AI just finished — save everything
      handleSaveSession();
    }

    prevStatus.current = status;
  }, [status, messages]); // messages is included so we always have the latest

  const handleSaveSession = async () => {
    // Filter out the synthetic welcome message before saving
    const realMessages = messages.filter((m) => m.id !== "welcome-msg");
    if (realMessages.length === 0) return; // Nothing to save yet

    // Convert UIMessage[] → plain { role, content }[] for storage
    const toSave = realMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: extractText(m),
    }));

    // Auto-generate the session title from the first user message
    const firstUserMsg = realMessages.find((m) => m.role === "user");
    const rawTitle = firstUserMsg ? extractText(firstUserMsg) : "New Conversation";
    const sessionTitle =
      rawTitle.length > 60 ? rawTitle.slice(0, 57) + "…" : rawTitle;

    const result = await upsertChatSession(
      activeSessionId,
      bookId,
      toSave,
      sessionTitle
    );

    if (result.success && result.sessionId) {
      if (!activeSessionId) {
        // This was a brand-new session — store its ID and update the URL
        // so the sidebar highlights it and the back button works correctly.
        // We use router.replace (not push) so the new chat URL doesn't stack
        // on top of the current URL in the browser history.
        setActiveSessionId(result.sessionId);
        router.replace(`/books/${bookSlug}/chat?session=${result.sessionId}`);
        router.refresh(); // Tell Next.js to re-fetch the sidebar's session list
      } else {
        // Updated an existing session — just refresh the sidebar metadata
        router.refresh();
      }
    }
  };

  // ── Send handling ─────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full pl-4">
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-4 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${
                m.role === "user"
                  ? "bg-[#E2D8C3] border-[#D4C3A3] text-[#6B4423]"
                  : "bg-[#6B4423] border-[#4A2F1D] text-[#FFFCF5]"
              }`}
            >
              {m.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-sm shadow-sm relative ${
                m.role === "user"
                  ? "bg-[#E2D8C3]/40 border border-[#D4C3A3] text-[#2C1810]"
                  : "bg-white border border-[#E2D8C3] text-[#4A3024]"
              }`}
            >
              {m.role === "assistant" && (
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage:
                      'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
                  }}
                />
              )}
              <div className="prose prose-sm prose-stone max-w-none font-serif leading-relaxed whitespace-pre-wrap">
                {m.parts?.map((part, i) => {
                  if (part.type === "text") {
                    return <ReactMarkdown key={i}>{(part as any).text}</ReactMarkdown>;
                  }
                  
                  if (
                    part.type === "tool-invocation" || 
                    part.type === "dynamic-tool" || 
                    part.type.startsWith("tool-")
                  ) {
                    const toolInvocation = part as any;
                    const toolCallId = toolInvocation.toolCallId;
                    if (toolInvocation.toolName === 'webSearch') {
                      return (
                        <div key={toolCallId || i} className="flex items-center gap-2 text-sm text-[#8C7A6B] bg-[#E2D8C3]/30 p-2 rounded-md my-2 border border-[#E2D8C3]">
                          {toolInvocation.state === 'result' ? (
                            <span>🔍 Finished searching: "{toolInvocation.args?.query}"</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <span className="animate-pulse">⏳</span>
                              Searching the web for: "{toolInvocation.args?.query}"...
                            </span>
                          )}
                        </div>
                      );
                    }
                  }

                  return null;
                })}
              </div>
            </div>
          </div>
        ))}

        {/* AI typing skeleton */}
        {isLoading && <ChatMessageSkeleton />}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#FFFCF5] border-t border-[#E2D8C3]">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 max-w-4xl mx-auto relative"
        >
          <div className="flex-1 relative">
            <textarea
              className="w-full resize-none bg-white border-2 border-[#D4C3A3] rounded-sm p-4 pr-12 focus:outline-none focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] font-sans text-[#2C1810] shadow-inner transition-colors min-h-[60px] max-h-[150px]"
              placeholder="Ask a question about the book…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }}
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-[60px] h-[60px] bg-[#6B4423] hover:bg-[#4A2F1D] disabled:bg-[#D4C3A3] disabled:cursor-not-allowed text-[#FFFCF5] rounded-sm flex items-center justify-center shadow-md transition-all active:translate-y-0.5"
          >
            <Send size={24} className={input.trim() && !isLoading ? "ml-1" : ""} />
          </button>
        </form>

        <div className="text-center mt-2">
          <span className="text-xs text-[#8C7A6B] font-serif italic">
            Press Enter to send · Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
