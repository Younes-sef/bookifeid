"use client";

/**
 * ChatMessageSkeleton
 *
 * A shimmer skeleton that mimics an AI assistant message bubble.
 * Shown while the AI is generating its response, giving users a clear
 * visual cue that something is happening — much better than a blank space.
 *
 * The three shimmer lines of varying widths simulate realistic text content.
 */

export default function ChatMessageSkeleton() {
  return (
    <div className="transcript-message transcript-message-assistant">
      <div
        className="max-w-[75%] px-6 py-4 rounded-2xl rounded-bl-sm"
        style={{ background: "#f3e4c7" }}
        aria-label="AI is generating a response"
        role="status"
      >
        {/* Three shimmer lines — varying widths for a realistic text feel */}
        <div className="flex flex-col gap-2.5">
          <div className="skeleton-shimmer h-4 rounded-full w-4/5" />
          <div className="skeleton-shimmer h-4 rounded-full w-11/12" />
          <div className="skeleton-shimmer h-4 rounded-full w-3/5" />
        </div>

        {/* Subtle "AI is thinking" label */}
        <p className="mt-3 text-xs text-[#8B7355] font-serif italic flex items-center gap-1.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#8B7355] animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#8B7355] animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#8B7355] animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
          <span className="ml-1">Thinking…</span>
        </p>
      </div>
    </div>
  );
}
