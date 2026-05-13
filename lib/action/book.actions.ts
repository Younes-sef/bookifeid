'use server'

import { put } from '@vercel/blob';
import { connectToDatabase } from '@/database/mongoose';
import Book from '@/database/models/book.model';
import BookSegment from '@/database/models/book-segment.model';
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

export async function uploadBook(formData: FormData) {
  try {
    await connectToDatabase();
    
    const file = formData.get('file') as File;
    const coverImage = formData.get('coverImage') as File | Blob | null;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const persona = formData.get('persona') as string;
    const clerkId = formData.get('clerkId') as string;
    const fileSize = Number(formData.get('fileSize'));

    const slug = generateSlug(title);

    // 1. Upload PDF to Vercel Blob
    const fileBlob = await put(`books/${slug}.pdf`, file, { access: 'public' });

    // 2. Upload Cover Image to Vercel Blob
    let coverURL = '';
    let coverBlobKey = '';

    if (coverImage) {
      const coverExt = coverImage.type.split('/')[1] || 'png';
      const coverBlobRes = await put(`covers/${slug}.${coverExt}`, coverImage, { access: 'public' });
      coverURL = coverBlobRes.url;
      coverBlobKey = coverBlobRes.pathname;
    }

    // 3. Save metadata to MongoDB
    const newBook = await Book.create({
      clerkId,
      title,
      slug,
      author,
      persona,
      fileURL: fileBlob.url,
      fileBlobKey: fileBlob.pathname,
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

export const getAllBooks = async () => {
  try {
    await connectToDatabase();
    const books = await Book.find().sort({ createdAt: -1 }).lean();
    return serializeData(books);
  } catch (error) {
    console.error("Error fetching all books", error);
    return [];
  }
}
