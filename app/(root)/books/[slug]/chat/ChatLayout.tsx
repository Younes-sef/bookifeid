"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, X } from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatClient from "./ChatClient";
import type { SerializedChatSessionMeta, SerializedChatMessage } from "@/lib/action/chat.actions";

interface ChatLayoutProps {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  fileURL: string;
  sessions: SerializedChatSessionMeta[];
  currentSessionId?: string;
  initialSessionId?: string;
  initialMessages: SerializedChatMessage[];
}

export default function ChatLayout({
  bookId,
  bookSlug,
  bookTitle,
  fileURL,
  sessions,
  currentSessionId,
  initialSessionId,
  initialMessages,
}: ChatLayoutProps) {
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  return (
    /**
     * The NavBar is `position: fixed` and 74px tall.
     * We use `pt-[74px]` to push this container below it, then
     * `h-screen` so the container fills the full viewport height.
     * `overflow-hidden` keeps all three panels from spilling out.
     */
    <div className="h-screen pt-[74px] bg-[#F5F1E7] flex flex-col overflow-hidden">

      {/* ── Header Bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[#FFFCF5] border-b border-[#E2D8C3] shadow-sm">

        {/* Back link */}
        <Link
          href={`/books/${bookSlug}`}
          className="flex items-center gap-1.5 text-sm text-[#8C7A6B] hover:text-[#2C1810] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <div className="h-4 w-px bg-[#E2D8C3] flex-shrink-0" />

        {/* Book info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold font-serif text-[#2C1810] flex-1 truncate">
            {bookTitle}
          </h1>
        </div>

        {/* PDF Toggle button */}
        <button
          onClick={() => setIsPdfOpen((prev) => !prev)}
          title={isPdfOpen ? "Close PDF viewer" : "Open PDF viewer"}
          className={`
            flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-semibold
            rounded-sm border transition-all duration-200
            ${
              isPdfOpen
                ? "bg-[#6B4423] text-[#FFFCF5] border-[#4A2F1D] shadow-sm"
                : "bg-transparent text-[#6B4423] border-[#D4C3A3] hover:border-[#6B4423] hover:bg-[#6B4423]/5"
            }
          `}
        >
          {isPdfOpen ? <X className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {isPdfOpen ? "Close PDF" : "View PDF"}
          </span>
        </button>
      </div>

      {/* ── Three-panel body ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Panel 1: Conversation Sidebar */}
        <ChatSidebar
          sessions={sessions}
          bookSlug={bookSlug}
          currentSessionId={currentSessionId}
        />

        {/* Panel 2: Chat — shrinks smoothly when PDF opens */}
        <div
          className="flex flex-col overflow-hidden bg-[#FFFCF5] border-l border-[#E2D8C3] relative transition-all duration-300 ease-in-out"
          style={{ flex: isPdfOpen ? "1 1 55%" : "1 1 100%" }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B4423]/70 z-10" />
          <ChatClient
            key={currentSessionId ?? "new"}
            bookId={bookId}
            bookSlug={bookSlug}
            title={bookTitle}
            initialSessionId={initialSessionId}
            initialMessages={initialMessages}
          />
        </div>

        {/* Panel 3: PDF Viewer — slides in from the right.
            We keep the iframe in the DOM even when closed (width:0, overflow:hidden)
            so the PDF doesn't reload from the network every time the user toggles it. */}
        <div
          className={`
            flex flex-col flex-shrink-0 overflow-hidden
            border-l border-[#E2D8C3] bg-[#F5F1E7]
            transition-all duration-300 ease-in-out
            ${isPdfOpen ? "w-[45%] opacity-100" : "w-0 opacity-0"}
          `}
        >
          {/* PDF panel header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#FFFCF5] border-b border-[#E2D8C3]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6B4423]" />
              <span className="text-sm font-semibold text-[#2C1810] whitespace-nowrap">
                PDF Viewer
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={fileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#8C7A6B] hover:text-[#2C1810] underline transition-colors whitespace-nowrap"
              >
                Open in new tab ↗
              </a>
              <button
                onClick={() => setIsPdfOpen(false)}
                className="p-1 rounded text-[#8C7A6B] hover:text-[#2C1810] hover:bg-[#E2D8C3] transition-colors"
                title="Close PDF viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* The iframe */}
          <iframe
            src={`${fileURL}#toolbar=1&navpanes=0`}
            className="flex-1 w-full border-0"
            title={`${bookTitle} — PDF`}
          />
        </div>
      </div>
    </div>
  );
}
