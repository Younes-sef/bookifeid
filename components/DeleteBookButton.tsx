"use client";

/**
 * DeleteBookButton — Client Component
 *
 * WHY a separate client component?
 *   The book detail page is a Server Component (it runs on the server, fetches data,
 *   and returns static HTML). Server Components cannot hold local state or attach
 *   browser event listeners. Because we need:
 *     - useState to show/hide the confirmation modal
 *     - A click handler to call the server action
 *     - A loading/spinner state during the async delete
 *   ...we must put this interactive island in its own "use client" file.
 *   The parent server component simply renders <DeleteBookButton bookId={...} />
 *   and React handles wiring the two together.
 *
 * HOW the delete works:
 *   1. User clicks the trash icon → modal opens (we never delete on first click — accidental deletes are painful)
 *   2. User reads the warning and clicks "Delete forever"
 *   3. We call deleteBook(bookId) — a Next.js Server Action.
 *      Server Actions are called like regular async functions from the client,
 *      but they actually run on the server. No API route needed.
 *   4. On success: toast + redirect to home.
 *   5. On error: toast error message, modal closes.
 */

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBook } from "@/lib/action/book.actions";

interface DeleteBookButtonProps {
  bookId: string;
  bookTitle: string;
}

export default function DeleteBookButton({ bookId, bookTitle }: DeleteBookButtonProps) {
  // Controls whether the confirmation modal is visible
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useTransition gives us isPending — a boolean that is true while
  // the server action is executing. We use it to show a spinner and
  // disable the buttons so the user can't double-submit.
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteBook(bookId);

      if (result.success) {
        toast.success(`"${bookTitle}" has been deleted.`);
        // Hard redirect: bypasses the Next.js router cache entirely.
        // router.push("/") + router.refresh() can race each other and leave
        // the user stuck on a stale page. window.location.href forces a full
        // browser navigation so the home page loads completely fresh.
        window.location.href = "/";
      } else {
        toast.error(result.error || "Failed to delete book. Please try again.");
        setIsModalOpen(false);
      }
    });
  };

  return (
    <>
      {/* ── Trash Icon Trigger ─────────────────────────────────────────── */}
      {/* Positioned as a small ghost button — destructive red on hover */}
      <button
        onClick={() => setIsModalOpen(true)}
        title="Delete this book"
        className="
          flex items-center justify-center gap-2 px-4 py-4
          bg-transparent border-2 border-[#D4C3A3]
          hover:border-red-400 hover:bg-red-50 hover:text-red-600
          text-[#4A3024] font-semibold rounded-sm
          transition-all duration-200
        "
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* ── Confirmation Modal ─────────────────────────────────────────── */}
      {/* We render a backdrop + modal only when isModalOpen is true.
          Using a conditional render (not CSS visibility) so the modal is
          fully removed from the DOM when closed — no accessibility issues. */}
      {isModalOpen && (
        // Backdrop — semi-transparent overlay, clicking it cancels
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !isPending && setIsModalOpen(false)}
        >
          {/* Modal card — stop click propagation so clicking inside doesn't close it */}
          <div
            className="
              relative w-full max-w-md
              bg-[#FFFCF5] border border-[#E2D8C3] rounded-sm
              shadow-[8px_8px_0px_0px_rgba(107,68,35,0.15)]
              p-8
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button (top-right X) */}
            {!isPending && (
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-[#8C7A6B] hover:text-[#2C1810] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Warning icon + heading */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2C1810]">Delete Book?</h2>
              <p className="mt-2 text-[#5C4033] text-sm leading-relaxed">
                You are about to permanently delete{" "}
                <span className="font-semibold italic">&ldquo;{bookTitle}&rdquo;</span>.
              </p>
            </div>

            {/* What will be deleted — so the user understands the full scope */}
            <div className="mb-6 p-4 rounded-sm bg-red-50 border border-red-200 text-sm text-red-700 space-y-1">
              <p className="font-semibold mb-2">This will permanently delete:</p>
              <p>✕ The PDF file from storage</p>
              <p>✕ The cover image from storage</p>
              <p>✕ All AI-generated embeddings &amp; text segments</p>
              <p>✕ All chat history for this book</p>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="
                  flex-1 px-4 py-3
                  bg-transparent border-2 border-[#D4C3A3]
                  hover:border-[#6B4423] hover:bg-[#6B4423]/5
                  text-[#4A3024] font-semibold rounded-sm
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="
                  flex-1 flex items-center justify-center gap-2 px-4 py-3
                  bg-red-600 hover:bg-red-700
                  text-white font-semibold rounded-sm
                  transition-all disabled:opacity-70 disabled:cursor-not-allowed
                  shadow-md
                "
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
