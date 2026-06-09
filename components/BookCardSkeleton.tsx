"use client";

/**
 * BookCardSkeleton
 *
 * A shimmer placeholder that matches the exact dimensions of <BookCard>.
 * Shown in a grid while the library is fetching books — prevents
 * jarring layout shifts and gives users a sense of what's loading.
 *
 * Usage:
 *   Show a grid of N BookCardSkeletons (e.g. 5) while books are loading.
 */

export default function BookCardSkeleton() {
  return (
    <div className="flex flex-col h-full" aria-hidden="true">
      {/* Cover placeholder — matches .book-card-cover-wrapper dimensions */}
      <div className="bg-white rounded-[14px] overflow-hidden flex items-center justify-center h-[205px] md:h-[240px]">
        <div className="skeleton-shimmer w-[110px] md:w-[130px] h-[160px] md:h-[195px] rounded-lg" />
      </div>

      {/* Meta placeholder */}
      <div className="mt-4 md:mt-5 flex flex-col gap-2">
        {/* Title shimmer */}
        <div className="skeleton-shimmer h-5 rounded-full w-4/5" />
        {/* Author shimmer */}
        <div className="skeleton-shimmer h-4 rounded-full w-3/5" />
      </div>
    </div>
  );
}
