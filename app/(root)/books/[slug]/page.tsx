import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/action/book.actions";
import { Headphones, BookOpen, Clock, Layers, Bookmark } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return (
    /* Main Background: Warm parchment tone */
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto bg-[#F5F1E7]">
      
      /* Card Container: Clean paper tone with an elegant border and subtle warm shadow */
      <div className="bg-[#FFFCF5] border border-[#E2D8C3] rounded-sm p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(107,68,35,0.1)] flex flex-col md:flex-row gap-12 relative overflow-hidden">
        
        {/* Subtle decorative spine/bookmark accent line on the left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#6B4423]/80"></div>

        {/* Left Column: Cover Image */}
        <div className="w-full md:w-1/3 flex-shrink-0 relative aspect-[2/3] rounded-r-lg rounded-l-sm overflow-hidden shadow-[8px_8px_20px_rgba(44,24,16,0.3)] ring-1 ring-black/5 transform transition-transform duration-500 hover:scale-[1.02]">
          {/* Simulated Book Spine Shadow */}
          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/40 to-transparent z-10 mix-blend-multiply"></div>
          <Image
            src={book.coverURL || "/placeholder-book.png"}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right Column: Book Details & Actions */}
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          
          {/* Badge: Looks like a small leather tag or ribbon */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#6B4423]/10 text-[#6B4423] border border-[#6B4423]/20 text-xs font-bold uppercase tracking-widest w-fit">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            Interactive Edition
          </div>

          {/* Title: Using a serif font for that classic printed book feel */}
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#2C1810] leading-tight mb-3">
            {book.title}
          </h1>

          <p className="text-xl text-[#5C4033] mb-8 font-serif italic">
            by <span className="font-semibold not-italic text-[#2C1810]">{book.author}</span>
          </p>

          {/* Stats Row: Styled like debossed or inset panels */}
          <div className="grid grid-cols-2 gap-4 mb-10 p-5 rounded-sm bg-[#F5F1E7]/50 border border-[#E2D8C3]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[#FFFCF5] rounded-full shadow-sm border border-[#E2D8C3]">
                <Layers className="w-5 h-5 text-[#8B5A2B]" />
              </div>
              <div>
                <p className="text-xs text-[#8C7A6B] uppercase tracking-wider font-semibold">Segments</p>
                <p className="text-xl font-serif font-bold text-[#2C1810]">{book.totalSegments.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[#FFFCF5] rounded-full shadow-sm border border-[#E2D8C3]">
                <Clock className="w-5 h-5 text-[#8B5A2B]" />
              </div>
              <div>
                <p className="text-xs text-[#8C7A6B] uppercase tracking-wider font-semibold">Voice Persona</p>
                <p className="text-xl font-serif font-bold text-[#2C1810] capitalize">{book.persona}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            {/* Primary Button: Deep Walnut / Leather tone */}
            <Link
              href={`/books/${slug}/chat`}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[#6B4423] hover:bg-[#4A2F1D] text-[#FFFCF5] font-semibold rounded-sm shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <Headphones className="w-5 h-5" />
              Start Conversation
            </Link>

            {/* Secondary Button: Subtle paper tone */}
            <a
              href={book.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent border-2 border-[#D4C3A3] hover:border-[#6B4423] hover:bg-[#6B4423]/5 text-[#4A3024] font-semibold rounded-sm transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Read PDF
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}