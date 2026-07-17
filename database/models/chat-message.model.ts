import { model, Schema, models, Types, Document } from "mongoose";

export interface IChatMessageDoc extends Document {
  sessionId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessageDoc>({
  sessionId: { type: Schema.Types.ObjectId, ref: "ChatSession", required: true, index: true },
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ChatMessage = models.ChatMessage || model<IChatMessageDoc>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
