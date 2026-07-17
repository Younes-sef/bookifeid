"use server";

/**
 * chat.actions.ts — Server Actions for Chat Session Management
 *
 * WHY server actions instead of API routes?
 *   Server actions run on the server but are called like normal async functions
 *   from the client. They're ideal for DB operations that don't need streaming
 *   (unlike the chat API which streams tokens). Using server actions here means:
 *     - No extra API routes to maintain
 *     - Automatic CSRF protection from Next.js
 *     - TypeScript types flow end-to-end
 *
 * Data flow:
 *   Frontend (UIMessage format with parts[]) ──► server action ──► MongoDB ({role, content})
 *   MongoDB ({role, content}) ──► server action ──► Frontend (UIMessage format)
 *
 *   We do this conversion because:
 *   - The AI SDK uses a rich `parts` array format for multimodal support
 *   - We only need plain text for storage — no need to store the full parts structure
 */

import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import ChatSession from "@/database/models/chat-session.model";
import ChatMessage from "@/database/models/chat-message.model";
import { serializeData } from "@/lib/utils";

// ── Type helpers ────────────────────────────────────────────────────────────────

/** What a single message looks like when we send it to/from the client */
export interface SerializedChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string; // ISO string (Date becomes string after JSON serialization)
}

/** What a session looks like in the sidebar list (no messages for performance) */
export interface SerializedChatSessionMeta {
  _id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Full session with messages (for loading a conversation) */
export interface SerializedChatSession extends SerializedChatSessionMeta {
  messages: SerializedChatMessage[];
}

// ── Server Actions ───────────────────────────────────────────────────────────────

/**
 * Get all sessions for a specific book (sidebar list).
 * We use .select('-messages') to skip the message content — we only need
 * titles and counts for the sidebar, which makes this query very fast.
 */
export async function getChatSessions(
  bookId: string
): Promise<SerializedChatSessionMeta[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();

    const sessions = await ChatSession.find({ bookId, clerkId: userId })
      .sort({ updatedAt: -1 }) // Most recently active first
      .lean();

    return serializeData(sessions) as SerializedChatSessionMeta[];
  } catch (error) {
    console.error("getChatSessions error:", error);
    return [];
  }
}

/**
 * Load a specific session's full message history.
 * We verify ownership (clerkId) so users can't load each other's sessions.
 */
export async function getChatSession(
  sessionId: string
): Promise<SerializedChatSession | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    await connectToDatabase();

    const session = await ChatSession.findOne({
      _id: sessionId,
      clerkId: userId,
    }).lean();

    if (!session) return null;

    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    const fullSession = {
      ...session,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };

    return serializeData(fullSession) as SerializedChatSession;
  } catch (error) {
    console.error("getChatSession error:", error);
    return null;
  }
}

/**
 * Save (create or update) a chat session.
 *
 * Called from the client after each AI response completes.
 * If sessionId is null → create a new session and return its ID.
 * If sessionId is provided → update the existing session's messages.
 *
 * The `title` is derived from the first user message (truncated to 60 chars).
 * This is set once on creation and never overwritten on updates.
 *
 * @param sessionId  null for new sessions, existing ID for updates
 * @param bookId     MongoDB ObjectId of the book being discussed
 * @param messages   Array of {role, content} — already extracted from UIMessage parts
 * @param title      Truncated first user message used as the session title
 */
export async function upsertChatSession(
  sessionId: string | null,
  bookId: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  title: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectToDatabase();

    if (sessionId) {
      // ── Update existing session ──────────────────────────────────────────
      const session = await ChatSession.findOne({ _id: sessionId, clerkId: userId });
      if (!session) return { success: false, error: "Session not found" };

      const newMessages = messages.slice(session.messageCount);
      if (newMessages.length > 0) {
        const messagesToInsert = newMessages.map(m => ({
          sessionId,
          role: m.role,
          content: m.content
        }));
        await ChatMessage.insertMany(messagesToInsert);
        
        session.messageCount = messages.length;
        await session.save();
      }
      return { success: true, sessionId };
    } else {
      // ── Create new session ───────────────────────────────────────────────
      const session = await ChatSession.create({
        bookId,
        clerkId: userId,
        title,
        messageCount: messages.length,
      });

      const messagesToInsert = messages.map(m => ({
        sessionId: session._id,
        role: m.role,
        content: m.content
      }));
      await ChatMessage.insertMany(messagesToInsert);

      return { success: true, sessionId: session._id.toString() };
    }
  } catch (error) {
    console.error("upsertChatSession error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save session",
    };
  }
}

/**
 * Delete a single chat session.
 * Ownership is verified by requiring both _id and clerkId to match.
 */
export async function deleteChatSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await connectToDatabase();

    const deleted = await ChatSession.findOneAndDelete({ _id: sessionId, clerkId: userId });
    if (deleted) {
      await ChatMessage.deleteMany({ sessionId });
    }
    return { success: true };
  } catch (error) {
    console.error("deleteChatSession error:", error);
    return { success: false, error: "Failed to delete session" };
  }
}
