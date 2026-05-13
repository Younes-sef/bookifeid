import { getBookBySlug } from "@/lib/action/book.actions";
import { notFound } from "next/navigation";
import ChatClient from "./ChatClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F5F1E7] flex flex-col">
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex flex-col mb-6 pb-6 border-b border-[#E2D8C3]">
          <h1 className="text-3xl font-serif font-bold text-[#2C1810]">
            Discussing: {book.title}
          </h1>
          <p className="text-sm text-[#8C7A6B] font-serif italic mt-1">
            with Persona: <span className="font-semibold capitalize text-[#6B4423]">{book.persona || 'Default'}</span>
          </p>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-[#FFFCF5] border border-[#E2D8C3] shadow-[8px_8px_0px_0px_rgba(107,68,35,0.1)] rounded-sm flex flex-col overflow-hidden relative">
           {/* Decorative spine accent */}
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B4423]/80 z-10"></div>
           
           <ChatClient bookId={book._id.toString()} title={book.title} />
        </div>
      </div>
    </main>
  );
}
