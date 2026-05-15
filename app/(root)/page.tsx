import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/action/book.actions";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();
  const books = userId ? await getAllBooks(userId) : [];

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
