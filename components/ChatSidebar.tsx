"use client";

/**
 * ChatSidebar — Conversation History Panel
 *
 * WHAT IT DOES:
 *   Shows all past conversations for the current book in a scrollable left panel.
 *   The user can start a new chat or click any past session to resume it.
 *   The currently active session is visually highlighted.
 *
 * HOW NAVIGATION WORKS:
 *   - "New Chat" → navigates to `/books/[slug]/chat` (no session param)
 *     The chat page detects no session and starts fresh.
 *   - Clicking a session → navigates to `/books/[slug]/chat?session=<id>`
 *     The chat page loads that session's messages and passes them to ChatClient.
 *
 * WHY CLIENT COMPONENT:
 *   We need `useRouter` for navigation and `useTransition` for the delete button's
 *   pending state. The session list data itself comes from the server (parent page
 *   fetches it and passes as props), so we get the best of both worlds:
 *   server-fetched data + client-side interactivity.
 */

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MessageSquarePlus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteChatSession } from "@/lib/action/chat.actions";
import type { SerializedChatSessionMeta } from "@/lib/action/chat.actions";

interface ChatSidebarProps {
  sessions: SerializedChatSessionMeta[];
  bookSlug: string;
  currentSessionId?: string;
}

/**
 * Converts an ISO date string to a human-readable relative time.
 * e.g. "2 hours ago", "Yesterday", "May 12"
 */
function relativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatSidebar({
  sessions,
  bookSlug,
  currentSessionId,
}: ChatSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNewChat = () => {
    // Navigate to the chat page WITHOUT a session param → starts a fresh chat
    router.push(`/books/${bookSlug}/chat`);
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === currentSessionId) return; // Already on this session
    router.push(`/books/${bookSlug}/chat?session=${sessionId}`);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    // Stop the click from bubbling up to the session card (which would navigate)
    e.stopPropagation();

    startTransition(async () => {
      const result = await deleteChatSession(sessionId);
      if (result.success) {
        toast.success("Conversation deleted.");
        // If we deleted the currently active session, go back to a fresh chat
        if (sessionId === currentSessionId) {
          window.location.href = `/books/${bookSlug}/chat`;
        } else {
          // Otherwise, just refresh the sidebar list
          router.refresh();
        }
      } else {
        toast.error("Failed to delete conversation.");
      }
    });
  };

  return (
    <aside className="
      w-72 flex-shrink-0 flex flex-col
      bg-[#F5F1E7] border-r border-[#E2D8C3]
      h-full overflow-hidden
    ">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-[#E2D8C3] flex-shrink-0">
        <p className="text-xs text-[#8C7A6B] uppercase tracking-widest font-semibold mb-3">
          Conversations
        </p>

        {/* New Chat button */}
        <button
          onClick={handleNewChat}
          className="
            w-full flex items-center gap-2 px-4 py-2.5
            bg-[#6B4423] hover:bg-[#4A2F1D]
            text-[#FFFCF5] text-sm font-semibold
            rounded-sm shadow-sm
            transition-all hover:-translate-y-0.5 hover:shadow-md
          "
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* ── Sessions List ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {sessions.length === 0 ? (
          // Empty state — shown when no past sessions exist yet
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare className="w-8 h-8 text-[#D4C3A3] mb-2" />
            <p className="text-xs text-[#8C7A6B] font-serif italic leading-relaxed">
              Your conversations will appear here after you send your first message.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session._id === currentSessionId;

            return (
              <div
                key={session._id}
                onClick={() => handleSelectSession(session._id)}
                className={`
                  group relative flex flex-col gap-1 p-3
                  rounded-sm border cursor-pointer
                  transition-all duration-150
                  ${
                    isActive
                      ? // Active session: warm walnut accent
                        "bg-[#FFFCF5] border-[#6B4423]/40 shadow-sm"
                      : // Inactive: subtle hover
                        "bg-transparent border-transparent hover:bg-[#FFFCF5] hover:border-[#E2D8C3]"
                  }
                `}
              >
                {/* Active indicator line on the left */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#6B4423] rounded-full" />
                )}

                {/* Session title */}
                <p
                  className={`
                    text-sm leading-snug line-clamp-2 pr-6
                    ${isActive ? "font-semibold text-[#2C1810]" : "text-[#4A3024]"}
                  `}
                >
                  {session.title}
                </p>

                {/* Meta row: date + message count */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8C7A6B]">
                    {relativeTime(session.updatedAt)}
                  </span>
                  <span className="text-[#D4C3A3] text-xs">·</span>
                  <span className="text-xs text-[#8C7A6B]">
                    {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Delete button — appears on hover, top-right corner */}
                <button
                  onClick={(e) => handleDeleteSession(e, session._id)}
                  disabled={isPending}
                  title="Delete conversation"
                  className="
                    absolute top-2 right-2
                    opacity-0 group-hover:opacity-100
                    p-1 rounded text-[#C4B5A0] hover:text-red-500
                    hover:bg-red-50 transition-all
                    disabled:opacity-50
                  "
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
