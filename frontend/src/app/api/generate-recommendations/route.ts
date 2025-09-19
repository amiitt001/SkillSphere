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
  You are an expert career and skills advisor. Your task is to provide personalized career path recommendations for a user in India.
  Your entire response MUST be a single, valid JSON object. Do not include any text, markdown formatting, or notes before or after the JSON object.

  The JSON object should have a single key "recommendations", which is an array of 3 career path objects.
  Each career path object must have the following keys:
  - "title": The name of the career path (e.g., "AI/Machine Learning Engineer").
  - "justification": A concise, one-sentence explanation of why it's a good fit for the user.
  - "roadmap": An array of 3-4 strings, with each string being a short, actionable step.

  User's Profile:
  - Academic Stream: ${academicStream}
  - Skills: ${skills.join(', ')}
  - Interests: ${interests.join(', ')}
  
  Example JSON format:
  {
    "recommendations": [
      {
        "title": "Example Career",
        "justification": "This fits your profile because...",
        "roadmap": ["First step.", "Second step.", "Third step."]
      }
    ]
  }
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