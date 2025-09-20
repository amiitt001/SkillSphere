// In frontend/src/app/api/resume-helper/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { skills, jobDescription } = await request.json();

    if (!skills || !jobDescription) {
      return NextResponse.json({ error: 'Missing skills or job description.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      Act as an expert career coach. Based on the user's list of skills and the provided job description, generate 3 to 5 powerful, action-oriented bullet points for their resume.
      Each bullet point should directly connect one or more of the user's skills to a requirement or responsibility in the job description.
      The response should be formatted as simple markdown text with each bullet point starting with a '*'.

      **User's Skills:**
      - ${skills.join('\n- ')}

      **Job Description:**
      ---
      ${jobDescription}
      ---
    `;

    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error("Error in resume-helper API route:", error);
    return NextResponse.json({ error: 'Failed to generate resume points.' }, { status: 500 });
  }
}