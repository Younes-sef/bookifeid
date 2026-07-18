import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Authenticate the user
        const { userId } = await auth();
        
        if (!userId) {
          throw new Error('Unauthorized');
        }

        // Return the required configuration for the Vercel Blob token
        return {
          allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            userId,
          }),
          allowOverwrite: true,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // The upload has finished. We don't need to save anything to the database here
        // because the client will submit the blob URLs to the uploadBook server action.
        console.log('Blob upload completed', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
