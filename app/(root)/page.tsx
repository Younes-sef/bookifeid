import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/action/book.actions";

export default async function Home() {
  const books = await getAllBooks();

  return (
    <main className="wrapper container">
      <HeroSection />
      
      {books.length > 0 ? (
        <div className="library-books-grid mt-12">
          {books.map((book: any) => (
            <BookCard 
              key={book._id} 
              title={book.title} 
              author={book.author} 
              coverURL={book.coverURL || "/placeholder-book.png"} 
              slug={book.slug} 
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center text-[var(--text-secondary)]">
          <p className="text-xl">No books found.</p>
          <p className="mt-2">Upload your first book to get started!</p>
        </div>
      )}
    </main>
  );
}
