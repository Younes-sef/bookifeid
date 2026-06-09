import Link from "next/link";
import {BookCardProps} from "@/types";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const BookCard = ({ title, author, coverURL, slug, status }: BookCardProps) => {
    const isProcessing = status === 'processing';

    const CardContent = (
        <article className={`book-card ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <figure className="book-card-figure relative">
                <div className="book-card-cover-wrapper">
                    <Image src={coverURL} alt={title} width={133} height={200} className="book-card-cover" />
                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-sm">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                <figcaption className="book-card-meta">
                    <h3 className="book-card-title">{title}</h3>
                    <p className="book-card-author">{author}</p>
                    {isProcessing && <p className="text-xs text-orange-600 font-semibold mt-1">Processing AI...</p>}
                </figcaption>
            </figure>
        </article>
    );

    if (isProcessing) {
        return CardContent;
    }

    return (
        <Link href={`/books/${slug}`}>
            {CardContent}
        </Link>
    )
}
export default BookCard