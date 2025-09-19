// Forcing a new build on Vercel - 19 Sept
// File: frontend/src/app/api/generate-recommendations/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { type NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';

export const runtime = 'edge';


export async function GET(request: NextRequest) { 
  try {
    // CHANGE #2: Read data from URL search parameters instead of a request body
    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream') || '';
    const skills = searchParams.get('skills')?.split(',') || [];
    const interests = searchParams.get('interests')?.split(',') || [];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `
      You are an expert career and skills advisor named "SkillSphere".
      Your task is to provide personalized career path recommendations for a user in India based on their academic stream, skills, and interests.
      The response should be well-formatted as markdown text, suitable for direct display to the user.

      User's Profile:
      - Academic Stream: ${academicStream}
      - Skills: ${skills.join(', ')}
      - Interests: ${interests.join(', ')}

      Instructions:
      1.  Analyze the user's profile to identify 3 distinct and relevant career paths.
      2.  For each path, provide a clear title and a few paragraphs explaining:
          - Why it's a good fit for the user.
          - A brief roadmap of actionable steps.
          - A typical salary range in India (LPA).
      3.  Format the entire output clearly using markdown (e.g., using ### for titles and bullet points for lists).
    `;

    // Get the streaming response from the AI
    const result = await model.generateContentStream(prompt);

    // Create a new stream that we can control and send to the browser
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          // Add each piece of text to our stream
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        // Signal that the stream is finished
        controller.close();
      },
    });


    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error("Error in generate-recommendations API route:", error);
    return new Response("Error generating recommendation.", { status: 500 });
  }
}