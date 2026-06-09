"use client";

/**
 * BookLibrary — Client Component
 *
 * WHAT IT DOES:
 *   Receives the full list of the user's books from the server and provides
 *   instant client-side search and sorting without any additional network requests.
 *
 * WHY CLIENT-SIDE FILTERING (not a server search)?
 *   A user's personal library is typically small (10–100 books), so filtering
 *   the full list in the browser is instant and requires no round-trip.
 *   If the library grew to thousands of books, we'd switch to server-side search
 *   with a debounced API call, but for this scale client-side is the right choice.
 *
 * HOW useMemo WORKS HERE:
 *   `useMemo` re-computes `filtered` only when `books`, `query`, or `sort`
 *   changes — not on every keystroke render. This keeps the filtering efficient
 *   even if someone types very fast.
 */

import { useState, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import BookCard from "@/components/BookCard";

type SortOption = "newest" | "oldest" | "title-az";

interface Book {
  _id: string;
  title: string;
  author: string;
  coverURL?: string;
  slug: string;
  status?: string;
  createdAt: string; // ISO string after JSON serialization
}

interface BookLibraryProps {
  books: Book[];
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  oldest: "Oldest First",
  "title-az": "Title A–Z",
};

export default function BookLibrary({ books }: BookLibraryProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");

  /**
   * `filtered` is recomputed only when books, query, or sort change.
   * Steps:
   *  1. Copy the array (never mutate props)
   *  2. Apply text filter (matches title OR author, case-insensitive)
   *  3. Apply sort
   */
  const filtered = useMemo(() => {
    let result = [...books];

    // ── Step 1: Text filter ────────────────────────────────────────────────
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    // ── Step 2: Sort ────────────────────────────────────────────────────────
    switch (sort) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "title-az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [books, query, sort]);

  const hasBooks = books.length > 0;
  const isSearching = query.trim().length > 0;

  return (
    <div className="mt-8">

      {/* ── Search + Sort bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* Search input */}
        <div className="relative flex-1">
          {/* Search icon on the left */}
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B] pointer-events-none" />

          <input
            type="text"
            placeholder="Search by title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full pl-10 pr-10 py-3
              bg-white border-2 border-[#D4C3A3] rounded-sm
              text-sm font-sans text-[#2C1810] placeholder:text-[#C4B5A0]
              focus:outline-none focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423]
              transition-colors shadow-sm
            "
          />

          {/* Clear button — only shows when there is a query */}
          {query && (
            <button
              onClick={() => setQuery("")}
              title="Clear search"
              className="
                absolute right-3.5 top-1/2 -translate-y-1/2
                text-[#8C7A6B] hover:text-[#2C1810] transition-colors
              "
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector — custom styled wrapper around a native <select>
            We use the native select for accessibility (keyboard, screen-reader
            support out of the box) and just style the container. */}
        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="
              appearance-none
              pl-4 pr-10 py-3
              bg-white border-2 border-[#D4C3A3] rounded-sm
              text-sm font-sans text-[#2C1810]
              focus:outline-none focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423]
              transition-colors shadow-sm cursor-pointer
              w-full sm:w-auto
            "
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-az">Title A–Z</option>
          </select>
          {/* Custom dropdown chevron */}
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6B] pointer-events-none" />
        </div>
      </div>

      {/* ── Results summary (shown only while searching) ─────────────────── */}
      {isSearching && (
        <p className="text-sm text-[#8C7A6B] mb-4 font-serif italic">
          {filtered.length === 0
            ? `No books match "${query}"`
            : `${filtered.length} book${filtered.length !== 1 ? "s" : ""} matching "${query}"`}
        </p>
      )}

      {/* ── Book Grid / Empty States ──────────────────────────────────────── */}
      {filtered.length > 0 ? (
        // ── Results: render the grid ──────────────────────────────────────
        <div className="library-books-grid">
          {filtered.map((book) => (
            <BookCard
              key={book._id}
              title={book.title}
              author={book.author}
              coverURL={book.coverURL || "/placeholder-book.png"}
              slug={book.slug}
              status={book.status}
            />
          ))}
        </div>
      ) : isSearching ? (
        // ── No search results (but books DO exist) ────────────────────────
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#E2D8C3] flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-[#8B5A2B]" />
          </div>
          <p className="text-xl font-serif font-semibold text-[#2C1810] mb-1">
            No books found
          </p>
          <p className="text-sm text-[#8C7A6B] mb-5">
            Nothing matched &ldquo;{query}&rdquo; — try a different title or author name.
          </p>
          <button
            onClick={() => setQuery("")}
            className="
              px-5 py-2.5 text-sm font-semibold
              bg-[#6B4423] hover:bg-[#4A2F1D] text-[#FFFCF5]
              rounded-sm transition-all shadow-sm
            "
          >
            Clear search
          </button>
        </div>
      ) : (
        // ── Library is completely empty ───────────────────────────────────
        <div className="mt-12 text-center text-[var(--text-secondary)]">
          <p className="text-xl font-serif">No books yet.</p>
          <p className="mt-2">Upload your first book to get started!</p>
        </div>
      )}
    </div>
  );
}
