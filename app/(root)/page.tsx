import HeroSection from "@/components/HeroSection";
import BookLibrary from "@/components/BookLibrary";
import LandingPage from "@/components/LandingPage";
import { getAllBooks } from "@/lib/action/book.actions";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  // Unauthenticated visitors see the public landing page
  if (!userId) {
    return <LandingPage />;
  }

  // Authenticated users see their personal library dashboard
  const books = await getAllBooks(userId);

  return (
    <main className="wrapper container">
      <HeroSection />
      {/* BookLibrary handles its own search, sort, and empty states client-side */}
      <BookLibrary books={books} />
    </main>
  );
}
