import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { auth } from '@clerk/nextjs/server';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { search as duckDuckSearch } from 'duck-duck-scrape';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/database/mongoose';
import BookSegment from '@/database/models/book-segment.model';
import Book from '@/database/models/book.model';
import ChatSession from '@/database/models/chat-session.model';
import mongoose from 'mongoose';
import { ratelimit } from '@/lib/upstash';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // ── Auth Guard ──────────────────────────────────────────────────────────
    // auth() reads the Clerk session cookie that is attached to every request
    // by the Clerk middleware. If the user is not logged in, userId is null
    // and we return 401 immediately — before touching the DB or calling Gemini.
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    // ────────────────────────────────────────────────────────────────────────

    // Rate Limiting
    if (ratelimit) {
      const { success, limit, reset, remaining } = await ratelimit.limit(userId);
      if (!success) {
        return new Response('Rate limit exceeded. Try again later.', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
    } else {
      console.warn("Rate limiting is disabled because UPSTASH_REDIS_REST_URL or TOKEN is missing in .env.local");
    }

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

    // 1.5 Query Rewriting (HyDE) - Translate conversational query to dense keywords
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
    const rewriteModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const rewritePrompt = `
      You are an AI search query generator.
      Convert the user's conversational message into a dense list of optimized keywords for a database search.
      If the user asks about a specific chapter (like Chapter 1), make sure to format it cleanly (e.g. "Chapter 1") and give it top priority.
      User Message: "${latestMessage}"
      Output ONLY the rewritten search query, nothing else.
    `;
    const rewriteResult = await rewriteModel.generateContent(rewritePrompt);
    const optimizedSearchQuery = rewriteResult.response.text().trim();
    console.log("Original Query:", latestMessage);
    console.log("Optimized Search Query:", optimizedSearchQuery);

    // 2. Generate embedding for the OPTIMIZED query
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const embedResult = await embedModel.embedContent({
      content: { role: 'user', parts: [{ text: optimizedSearchQuery }] },
      outputDimensionality: 768
    } as any);
    const embedding = embedResult.embedding.values;

    // 3. Perform Hybrid Search: Vector Search + Keyword Search

    // A. Vector Search (Semantic meaning)
    const vectorSegments = await BookSegment.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 200,
          limit: 20,
          filter: { bookId: new mongoose.Types.ObjectId(bookId) }
        }
      },
      {
        // Extra safety: ensure only segments from this book are returned
        $match: { bookId: new mongoose.Types.ObjectId(bookId) }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          pageNumber: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);

    // B. Keyword Search (Exact matches, e.g. "Chapter 1")
    // We use the existing text index on the content field.
    const keywordSegments = await BookSegment.find(
      { 
        bookId: new mongoose.Types.ObjectId(bookId), 
        $text: { $search: optimizedSearchQuery } 
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(10)
    .lean();

    // C. Merge and Deduplicate Results (Interleaving them)
    const mergedSegmentsMap = new Map();
    const finalSegments: any[] = [];
    
    // We will interleave them: 1 from vector, 1 from keyword, etc.
    const maxLength = Math.max(vectorSegments.length, keywordSegments.length);
    for (let i = 0; i < maxLength; i++) {
      // Try adding one from keyword search first (since it's exact match, it's highly relevant)
      if (i < keywordSegments.length) {
        const kSeg = keywordSegments[i];
        const idStr = kSeg._id.toString();
        if (!mergedSegmentsMap.has(idStr)) {
          mergedSegmentsMap.set(idStr, true);
          finalSegments.push(kSeg);
        }
      }
      // Try adding one from vector search
      if (i < vectorSegments.length) {
        const vSeg = vectorSegments[i];
        const idStr = vSeg._id.toString();
        if (!mergedSegmentsMap.has(idStr)) {
          mergedSegmentsMap.set(idStr, true);
          finalSegments.push(vSeg);
        }
      }
      
      // Break early if we reached our target limit
      if (finalSegments.length >= 25) {
        break;
      }
    }

    const segments = finalSegments.slice(0, 25);

    // Format the context for the AI
    const contextStr = segments.map((seg, i) => `--- Excerpt ${i + 1} (Page ${seg.pageNumber || 'Unknown'}) ---\n${seg.content}`).join('\n\n');

    // 4. Construct the System Prompt
    const systemPrompt = `
You are a helpful, intelligent, and conversational AI assistant—similar to ChatGPT or Google Gemini.

You are an expert on the book "${book.title}" by ${book.author}, but you are also a general-purpose AI assistant with vast knowledge.
The user might ask about the book, or they might ask general questions.

Below are the most relevant excerpts retrieved from the book based on their question.

<BOOK_EXCERPTS>
${contextStr}
</BOOK_EXCERPTS>

INSTRUCTIONS:
1. CRITICAL: If the user refers to "this pdf", "this book", or "this document", they are referring to the book excerpts provided above. DO NOT say you cannot read PDFs or access files. The system has already read the PDF and provided the relevant text to you.
2. If the user asks about the book/PDF, use the provided excerpts as your primary source of truth.
3. If the answer is not in the excerpts, or if the user asks a general knowledge question, use your vast general knowledge to answer.
4. If you need up-to-date information, facts you are unsure about, or if the user explicitly asks you to search, use the \`webSearch\` tool.
5. If the user asks for a summary or "resume" of the book or a topic, provide a comprehensive, well-structured summary based on the excerpts and your knowledge of the book.
6. Keep your answers engaging, concise, and easy to read. Use formatting like bullet points if helpful.
7. If applicable, you can mention the excerpt number or page number you got the information from when discussing the book.
8. When explaining acronyms or concepts (like "YOLO"), always prioritize technical, academic, and domain-specific meanings (like "You Only Look Once" in Computer Vision) that align with the book's topic over pop-culture slang or general definitions.
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

    // --- Sliding Window & Summary Logic ---
    let messagesForLLM = formattedMessages;
    let sessionSummary = "";

    if (body.sessionId) {
      const session = await ChatSession.findById(body.sessionId).lean();
      if (session) {
        sessionSummary = session.summary || "";
      }
    }

    const WINDOW_SIZE = 10;
    if (formattedMessages.length > WINDOW_SIZE) {
      messagesForLLM = formattedMessages.slice(-WINDOW_SIZE);
      
      const outOfWindowCount = formattedMessages.length - WINDOW_SIZE;
      // Generate a new summary every time 10 messages fall out of the window
      if (outOfWindowCount > 0 && outOfWindowCount % 10 === 0 && body.sessionId) {
        const newBatchToSummarize = formattedMessages.slice(0, -WINDOW_SIZE); 
        try {
          const summaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const prompt = `You are summarizing an ongoing conversation about a book. 
Previous summary: ${sessionSummary || "None"}
Messages to include in summary: ${JSON.stringify(newBatchToSummarize)}
Please provide a concise, unified summary of the entire conversation so far to be used as context for future turns.`;
          
          const summaryResult = await summaryModel.generateContent(prompt);
          sessionSummary = summaryResult.response.text();
          await ChatSession.findByIdAndUpdate(body.sessionId, { summary: sessionSummary }).exec();
        } catch(e) {
          console.error("Summary generation error:", e);
        }
      }
    }

    const finalSystemPrompt = sessionSummary 
      ? systemPrompt + `\n\n<CONVERSATION_SUMMARY>\nThe following is a summary of the older parts of the conversation:\n${sessionSummary}\n</CONVERSATION_SUMMARY>`
      : systemPrompt;

    // 5. Call Gemini to generate the streaming response
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: finalSystemPrompt,
      messages: messagesForLLM,
      // @ts-ignore - maxSteps might throw a type error on older SDK versions but works at runtime
      maxSteps: 5,
      tools: {
        webSearch: tool({
          description: 'Search the web for up-to-date information or facts you do not know.',
          parameters: z.object({
            query: z.string().describe('The search query to look up on the web.'),
          }),
          // @ts-ignore - The types of `duckDuckSearch` cause TS to fail matching the tool overload
          execute: async ({ query }) => {
            try {
              console.log("Searching web for:", query);
              // safeSearch expects -2 for OFF in duck-duck-scrape
              const searchResults = await duckDuckSearch(query, { safeSearch: -2 });
              return searchResults.results.slice(0, 3).map((r: any) => ({
                title: r.title,
                snippet: r.description,
                url: r.url
              }));
            } catch (err: any) {
              console.error("Web search failed:", err);
              return "Failed to perform web search.";
            }
          },
        }),
      },
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
