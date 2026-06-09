'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/database/mongoose';
import BookSegment from '@/database/models/book-segment.model';
import Book from '@/database/models/book.model';
import { after } from 'next/server';

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generates vector embeddings for a given book's text segments
 * using Google's gemini-embedding-2 model.
 * 
 * Uses next/server `after` to process the embeddings in the background
 * without blocking the user's upload response.
 */
export async function generateEmbeddingsForBook(bookId: string) {
    try {
        // Run the heavy embedding processing in the background
        after(async () => {
            console.log(`[Background] Starting embedding process for book: ${bookId}`);
            
            try {
                await connectToDatabase();

                const segments = await BookSegment.find({
                    bookId: bookId,
                    embedding: { $exists: false }
                }).sort({ segmentIndex: 1 }).select('_id content segmentIndex').lean();
                
                const segmentsToProcess = segments.map(s => ({ 
                    _id: s._id.toString(), 
                    content: s.content, 
                    segmentIndex: s.segmentIndex 
                }));

                if (segmentsToProcess.length === 0) {
                    await Book.findByIdAndUpdate(bookId, { status: 'ready' });
                    console.log(`[Background] Book ${bookId} is ready. All segments already embedded.`);
                    return;
                }

                const BATCH_SIZE = 25; 
                for (let i = 0; i < segmentsToProcess.length; i += BATCH_SIZE) {
                    const batch = segmentsToProcess.slice(i, i + BATCH_SIZE);
                    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
                         
                    for (const segment of batch) {
                        try {
                            const result = await model.embedContent({
                                content: { role: 'user', parts: [{ text: segment.content }] },
                                outputDimensionality: 768
                            } as any);
                            const embeddingValues = result.embedding.values;
                                 
                            await BookSegment.findByIdAndUpdate(segment._id, {
                                embedding: embeddingValues
                            });
                                 
                            // Respect rate limits
                            await new Promise(resolve => setTimeout(resolve, 200));
                        } catch (e) {
                            console.error(`[Background] Error embedding segment ${segment.segmentIndex}:`, e);
                            // We don't rethrow because we want to continue processing the rest of the segments
                        }
                    }
                }

                // Mark the book as ready once all segments are embedded
                await Book.findByIdAndUpdate(bookId, { status: 'ready' });
                console.log(`[Background] Successfully completed embeddings for book: ${bookId}`);

            } catch (err) {
                console.error(`[Background] Fatal error processing embeddings for book ${bookId}:`, err);
            }
        });

        return { success: true, message: "Embedding job queued successfully." };
    } catch (error) {
        console.error("Error queueing embedding job:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
