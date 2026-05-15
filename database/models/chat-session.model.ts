import { model, Schema, models, Types, Document } from "mongoose";

/**
 * ChatSession Model
 *
 * Each document represents one conversation between a user and a specific book.
 * A single book can have many ChatSessions (one per conversation thread).
 *
 * WHY store messages here (not in BookSegment)?
 *   BookSegments store the book's extracted text + embeddings — read-only data.
 *   ChatSessions store the *conversation history* — a completely different
 *   concern. Keeping them separate lets us delete books and their segments
 *   without touching conversation history, and vice versa.
 *
 * Message format:
 *   We store { role, content } — the minimal representation. The frontend
 *   uses Vercel AI SDK UIMessage format (with `parts` arrays), so we convert
 *   on the way in and out (see chat.actions.ts).
 */

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;        // Plain text extracted from the parts array
  createdAt: Date;
}

export interface IChatSession extends Document {
  _id: string;
  bookId: Types.ObjectId;
  clerkId: string;
  title: string;          // Auto-generated from the first user message
  messages: IChatMessage[];
  messageCount: number;   // Denormalised count for fast sidebar queries
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, required: true, enum: ["user", "assistant"] },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // Sub-documents don't need their own _id
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    clerkId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: "New Conversation" },
    messages: [ChatMessageSchema],
    // Stored separately so the sidebar query can skip the messages array entirely
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index: all sessions for a user's book, sorted newest first
ChatSessionSchema.index({ bookId: 1, clerkId: 1, updatedAt: -1 });

const ChatSession =
  models.ChatSession || model<IChatSession>("ChatSession", ChatSessionSchema);

export default ChatSession;
