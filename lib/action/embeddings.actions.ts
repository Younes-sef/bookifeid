'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/database/mongoose';
import BookSegment from '@/database/models/book-segment.model';

// Initialize the Google Generative AI SDK
// Ensure you have GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generates vector embeddings for a given book's text segments
 * using Google's text-embedding-004 model.
 */
export async function generateEmbeddingsForBook(bookId: string) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }

        await connectToDatabase();

        // 1. Find all segments for this book that DO NOT have an embedding yet
        const segmentsToProcess = await BookSegment.find({
            bookId: bookId,
            embedding: { $exists: false }
        }).sort({ segmentIndex: 1 });

        if (segmentsToProcess.length === 0) {
            console.log("No new segments to process for embeddings.");
            return { success: true, message: "All segments already have embeddings." };
        }

        console.log(`Found ${segmentsToProcess.length} segments to generate embeddings for.`);

        // 2. Initialize the embedding model
        // text-embedding-004 is deprecated/missing, using gemini-embedding-2
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

        // 3. Process in batches to avoid rate limits (we process sequentially here to be safe)
        let processedCount = 0;
        
        for (const segment of segmentsToProcess) {
            try {
                // Generate the embedding for the segment's content (force 768 dimensions)
                const result = await model.embedContent({
                    content: { role: 'user', parts: [{ text: segment.content }] },
                    outputDimensionality: 768
                } as any);
                const embeddingValues = result.embedding.values;

                // Save the embedding back to the MongoDB document
                await BookSegment.findByIdAndUpdate(segment._id, {
                    embedding: embeddingValues
                });

                processedCount++;
                
                // Optional: slight delay to avoid rate limits on free tier
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (embedError) {
                console.error(`Error embedding segment ${segment.segmentIndex}:`, embedError);
                // Continue with the next segment even if one fails
            }
        }

        console.log(`Successfully generated embeddings for ${processedCount}/${segmentsToProcess.length} segments.`);
        return { success: true, processedCount };
    } catch (error) {
        console.error("Error generating embeddings for book:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
