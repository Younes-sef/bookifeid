import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBookBySlug } from "@/lib/action/book.actions";
import { getChatSessions, getChatSession } from "@/lib/action/chat.actions";
import ChatClient from "./ChatClient";
import ChatSidebar from "@/components/ChatSidebar";

/**
 * Chat Page — Server Component
 *
 * WHY THIS IS A SERVER COMPONENT:
 *   - It fetches the book, the session list, and (if a sessionId is in the URL)
 *     the full session messages — all on the server before any HTML reaches
 *     the browser. This avoids a loading flicker where the sidebar is empty
 *     or the chat shows blank then loads.
 *   - Server components can't hold state or handle events, so the interactive
 *     parts (ChatClient, ChatSidebar) are separate "use client" components.
 *
 * URL PATTERNS:
 *   /books/[slug]/chat            → new conversation (no session)
 *   /books/[slug]/chat?session=id → load a specific past conversation
 *
 * DATA FLOW:
 *   1. Read `session` from searchParams
 *   2. Fetch sessions list (for sidebar) in parallel with book + session data
 *   3. Pass everything as props to the client components
 */

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { session: sessionId } = await searchParams;

  // Get the currently logged-in user
  const { userId } = await auth();

  // Fetch the book first — we need its _id before we can query sessions
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  // Now that we have the book _id, fetch the sidebar sessions and the active
  // session in parallel — no reason to wait for one before starting the other.
  const [bookSessions, activeSession] = await Promise.all([
    userId ? getChatSessions(book._id) : Promise.resolve([]),
    sessionId ? getChatSession(sessionId) : Promise.resolve(null),
  ]);

  return (
    <main className="h-[calc(100vh-64px)] bg-[#F5F1E7] flex flex-col overflow-hidden">

      {/* ── Top Header Bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 bg-[#FFFCF5] border-b border-[#E2D8C3] shadow-sm">
        <Link
          href={`/books/${slug}`}
          className="flex items-center gap-1.5 text-sm text-[#8C7A6B] hover:text-[#2C1810] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="h-4 w-px bg-[#E2D8C3]" />

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-serif font-bold text-[#2C1810] truncate">
            {book.title}
          </h1>
          <p className="text-xs text-[#8C7A6B] italic">
            Persona: <span className="capitalize font-semibold text-[#6B4423]">{book.persona || "Default"}</span>
          </p>
        </div>
      </div>

      {/* ── Two-column layout: Sidebar + Chat ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Conversation History Sidebar */}
        <ChatSidebar
          sessions={bookSessions}
          bookSlug={slug}
          currentSessionId={sessionId}
        />

        {/* Right: Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FFFCF5] border-l border-[#E2D8C3] relative">
          {/* Decorative spine line (matches the book card style) */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B4423]/70 z-10" />

          <ChatClient
            key={sessionId ?? "new"}
            bookId={book._id}
            bookSlug={slug}
            title={book.title}
            initialSessionId={sessionId}
            initialMessages={activeSession?.messages ?? []}
          />
        </div>
      </div>
    </main>
  );
}
