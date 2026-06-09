import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getBookBySlug } from "@/lib/action/book.actions";
import { getChatSessions, getChatSession } from "@/lib/action/chat.actions";
import ChatLayout from "./ChatLayout";

/**
 * Chat Page — Server Component
 *
 * This is intentionally thin. Its only job is:
 *   1. Read URL params (slug + optional ?session=id)
 *   2. Fetch data from MongoDB
 *   3. Pass everything to <ChatLayout> (the client component that owns UI state)
 *
 * WHY KEEP THIS AS A SERVER COMPONENT:
 *   Fetching on the server means zero loading flicker — all data (sessions list,
 *   existing messages, book info) arrives with the initial HTML. The user sees
 *   a fully populated UI instead of skeletons loading in sequence.
 *
 * URL PATTERNS:
 *   /books/[slug]/chat              → new conversation
 *   /books/[slug]/chat?session=xyz  → resume session xyz
 */

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { session: sessionId } = await searchParams;

  const { userId } = await auth();

  // Fetch the book first — we need its _id before querying sessions
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  // Fetch sessions list (sidebar) and the active session in parallel
  const [bookSessions, activeSession] = await Promise.all([
    userId ? getChatSessions(book._id) : Promise.resolve([]),
    sessionId ? getChatSession(sessionId) : Promise.resolve(null),
  ]);

  return (
    <ChatLayout
      bookId={book._id}
      bookSlug={slug}
      bookTitle={book.title}
      bookPersona={book.persona}
      fileURL={book.fileURL}
      sessions={bookSessions}
      currentSessionId={sessionId}
      initialSessionId={sessionId}
      initialMessages={activeSession?.messages ?? []}
    />
  );
}
