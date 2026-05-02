'use server'

import { put } from '@vercel/blob';
import { connectToDatabase } from '@/database/mongoose';
import Book from '@/database/models/book.model';

export async function uploadBook(formData: FormData) {
  try {
    await connectToDatabase();
    
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const userId = formData.get('userId') as string;

    // 1. Upload PDF to Vercel Blob
    const blob = await put(`books/${file.name}`, file, { access: 'public' });

    // 2. Save metadata to MongoDB
    const newBook = await Book.create({
      title,
      author,
      pdfUrl: blob.url,
      userId
    });

    return JSON.parse(JSON.stringify(newBook));
  } catch (error) {
    console.error("Upload failed", error);
    throw new Error('Upload failed');
  }
}
