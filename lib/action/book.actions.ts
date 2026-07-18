'use server'

import { put, del } from '@vercel/blob';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/database/mongoose';
import Book from '@/database/models/book.model';
import BookSegment from '@/database/models/book-segment.model';
import User from '@/database/models/user.model';
import { PLAN_LIMITS } from '../subscription-constants';
import { generateSlug, serializeData } from '../utils';
import { TextSegment } from '@/types';

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({slug}).lean();

        if(existingBook) {
            return {
                exists: true,
                book: serializeData(existingBook)
            }
        }

        return {
            exists: false,
        }
    } catch (e) {
        console.error('Error checking book exists', e);
        return {
            exists: false, error: e instanceof Error ? e.message : String(e)
        }
    }
}

export async function uploadBook(bookData: {
  title: string;
  author: string;
  clerkId: string;
  fileSize: number;
  fileURL: string;
  fileBlobKey: string;
  coverURL: string;
  coverBlobKey: string;
}) {
  try {
    await connectToDatabase();
    
    const { title, author, clerkId, fileSize, fileURL, fileBlobKey, coverURL, coverBlobKey } = bookData;
    const description = "No description provided.";

    const slug = generateSlug(title);

    let user = await User.findOne({ clerkId });
    if (!user) {
      user = await User.create({ clerkId, tier: 'free' });
    }

    const tier = user.tier || 'free';
    const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS];

    const maxSizeBytes = 50 * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      return { success: false, error: 'File size exceeds the 50MB limit.' };
    }

    const bookCount = await Book.countDocuments({ clerkId });
    if (bookCount >= limits.maxBooks) {
      return { success: false, error: `You have reached the limit of ${limits.maxBooks} books for the ${tier} tier. Please upgrade to upload more.` };
    }

    // 3. Save metadata to MongoDB
    const newBook = await Book.create({
      clerkId,
      title,
      slug,
      author,
      description,
      fileURL,
      fileBlobKey,
      coverURL,
      coverBlobKey,
      fileSize,
      totalSegments: 0 // Will be updated when segments are saved
    });

    return { success: true, book: serializeData(newBook) };
  } catch (error) {
    console.error("Upload failed", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to upload book" };
  }
}

export async function saveBookSegments(bookId: string, clerkId: string, segments: TextSegment[]) {
  try {
    await connectToDatabase();
    
    const segmentDocs = segments.map((seg) => ({
      clerkId,
      bookId,
      content: seg.text,
      segmentIndex: seg.segmentIndex,
      pageNumber: seg.pageNumber || 1,
      wordCount: seg.wordCount
    }));

    await BookSegment.insertMany(segmentDocs);

    await Book.findByIdAndUpdate(bookId, {
      totalSegments: segments.length
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save segments", error);
    return { success: false, error: "Failed to save segments" };
  }
}

export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();
    const book = await Book.findOne({ slug }).lean();
    if (!book) return null;
    return serializeData(book);
  } catch (error) {
    console.error("Error fetching book by slug", error);
    return null;
  }
}

export const getAllBooks = async (clerkId: string) => {
  try {
    await connectToDatabase();
    const books = await Book.find({ clerkId }).sort({ createdAt: -1 }).lean();
    return serializeData(books);
  } catch (error) {
    console.error("Error fetching all books", error);
    return [];
  }
}

/**
 * Deletes a book and all related data owned by the currently logged-in user.
 *
 * Step 1 — Ownership check:
 *   We call auth() on the server to get the real Clerk userId.
 *   Then we do Book.findOne({ _id: bookId, clerkId: userId }).
 *   Passing BOTH conditions means MongoDB only returns the doc if the book
 *   truly belongs to the requesting user — this prevents one user from
 *   deleting another user's books even if they guess the ID.
 *
 * Step 2 — Delete segments:
 *   Every BookSegment has a bookId foreign key.
 *   We wipe them all first so MongoDB is never left with orphaned embedding vectors.
 *
 * Step 3 — Delete blobs:
 *   We collected the public PDF URL and cover URL when uploading (stored in fileURL / coverURL).
 *   Vercel Blob's del() accepts an array of URLs and removes them from object storage.
 *   We filter out empty strings so we don't send a delete request for books with no cover.
 *
 * Step 4 — Delete the book document:
 *   Only after segments and blobs are gone do we remove the root Book doc.
 *   This order matters: if a step fails partway, the book doc still exists
 *   and the user can retry (rather than having a ghost doc with no files).
 */
export async function deleteBook(bookId: string) {
  try {
    // Step 1 — Verify the caller is logged in and owns this book
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    // findOne with BOTH _id and clerkId — rejects if the book belongs to another user
    const book = await Book.findOne({ _id: bookId, clerkId: userId }).lean();
    if (!book) {
      return { success: false, error: 'Book not found or you do not have permission to delete it.' };
    }

    // Step 2 — Remove all vector-embedded text segments for this book
    await BookSegment.deleteMany({ bookId });

    // Step 3 — Remove files from Vercel Blob object storage
    // We filter out falsy values so we never call del('') for books without a cover
    const urlsToDelete = [book.fileURL, book.coverURL].filter(Boolean) as string[];
    if (urlsToDelete.length > 0) {
      await del(urlsToDelete);
    }

    // Step 4 — Remove the book document itself
    await Book.findByIdAndDelete(bookId);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete book:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete book' };
  }
}
