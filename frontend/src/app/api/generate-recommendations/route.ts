import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // --- FINAL DIAGNOSTIC LOG ---
    // This will print all environment variables the Vercel function can see.
    console.log("--- Vercel Environment Variables Dump ---");
    console.log(JSON.stringify(process.env, null, 2));
    console.log("-----------------------------------------");

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("CRITICAL: The GEMINI_API_KEY was not found in the environment variables dump above.");
      return new Response("Error: Server is missing the required GEMINI API KEY.", { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream') || '';
    const skills = searchParams.get('skills')?.split(',') || [];
    const interests = searchParams.get('interests')?.split(',') || [];

    const prompt = `
      You are an expert career and skills advisor... [prompt content] ...
      - Academic Stream: ${academicStream}
      - Skills: ${skills.join(', ')}
      - Interests: ${interests.join(', ')}
    `;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok || !apiResponse.body) {
      const errorText = await apiResponse.text();
      console.error("Error from Google AI API:", errorText);
      return new Response(`Error from API: ${errorText}`, { status: apiResponse.status });
    }
    
    return new Response(apiResponse.body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error("CRITICAL ERROR in generate-recommendations API route:", error);
    return new Response("A critical error occurred on the server.", { status: 500 });
  }
}
