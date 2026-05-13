import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
import { streamText } from 'ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/database/mongoose';
import BookSegment from '@/database/models/book-segment.model';
import Book from '@/database/models/book.model';
import mongoose from 'mongoose';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json();
    console.log("CHAT API REQUEST BODY:", body);

    const bookId = req.headers.get('x-book-id') || url.searchParams.get('bookId') || body.bookId;
    const { messages } = body;

    if (!messages || !bookId) {
      console.log("Missing fields in Chat API:", { hasMessages: !!messages, hasBookId: !!bookId });
      return new Response('Missing required fields', { status: 400 });
    }

    const lastMsg = messages[messages.length - 1];
    let latestMessage = '';

    // Extract text from parts array (Vercel AI SDK v6 format)
    if (lastMsg.parts) {
      const textPart = lastMsg.parts.find((p: any) => p.type === 'text');
      if (textPart) latestMessage = textPart.text;
    } else if (lastMsg.content) {
      // Fallback for older formats if they ever arrive
      latestMessage = lastMsg.content;
    }

    if (!latestMessage) {
      return new Response('No valid text found in latest message', { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch book details for context
    const book = await Book.findById(bookId).lean();
    if (!book) {
      return new Response('Book not found', { status: 404 });
    }

    // 2. Generate embedding for the user's query
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const embedResult = await embedModel.embedContent({
      content: { role: 'user', parts: [{ text: latestMessage }] },
      outputDimensionality: 768
    } as any);
    const embedding = embedResult.embedding.values;

    // 3. Perform Vector Search in MongoDB
    // We use aggregate to run $vectorSearch
    const segments = await BookSegment.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100, // Number of candidates to consider
          limit: 5 // We want the top 5 most relevant segments
        }
      },
      {
        $project: {
          content: 1,
          pageNumber: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);

    // Format the context for the AI
    const contextStr = segments.map((seg, i) => `--- Excerpt ${i + 1} (Page ${seg.pageNumber || 'Unknown'}) ---\n${seg.content}`).join('\n\n');

    // 4. Construct the System Prompt
    const personaInstruction = book.persona
      ? `You are adopting the persona of "${book.persona}". Adjust your tone and vocabulary to match this persona.`
      : `You are a helpful and articulate assistant.`;

    const systemPrompt = `
${personaInstruction}

You are an expert on the book "${book.title}" by ${book.author}.
The user is asking a question about this book.
Below are the most relevant excerpts retrieved from the book based on their question.

<BOOK_EXCERPTS>
${contextStr}
</BOOK_EXCERPTS>

INSTRUCTIONS:
1. Answer the user's question based strictly on the provided book excerpts.
2. If the answer is not contained in the excerpts, say "I couldn't find the exact answer in the text, but based on the context..." and give your best educated guess, but make it clear it is a guess.
3. Keep your answers engaging, concise, and easy to read. Use formatting like bullet points if helpful.
4. If applicable, you can mention the excerpt number or page number you got the information from.
`;

    const formattedMessages = messages.map((msg: any) => {
      if (msg.parts) {
        const textPart = msg.parts.find((p: any) => p.type === 'text');
        return {
          role: msg.role,
          content: textPart ? textPart.text : ''
        };
      }
      return {
        role: msg.role,
        content: msg.content || ''
      };
    });

    // 5. Call Gemini to generate the streaming response
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: formattedMessages,
    });

    return result.toUIMessageStreamResponse();

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error.message || error.toString(),
      stack: error.stack
    }), { status: 500 });
  }
}
