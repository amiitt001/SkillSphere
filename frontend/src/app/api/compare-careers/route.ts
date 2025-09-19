// In frontend/src/app/api/compare-careers/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const career1 = searchParams.get('career1');
    const career2 = searchParams.get('career2');

    if (!career1 || !career2) {
      return new Response("Error: Please provide two careers to compare.", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const prompt = `
  You are an expert career advisor. Your task is to provide a comparison between two career paths for a user in India.
  Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or notes outside of the JSON.

  The JSON object must have two top-level keys: "summary" and "tableData".
  - "summary": A 2-3 sentence paragraph comparing the careers at a high level.
  - "tableData": An array of objects, where each object represents a row in a comparison table.

  Each object in the "tableData" array must have three keys:
  - "feature": The name of the feature being compared (e.g., "Core Skills", "Tools & Tech", "Focus").
  - "career1_details": The details for the first career, "${career1}".
  - "career2_details": The details for the second career, "${career2}".

  Generate at least 4-5 feature comparison rows.
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
    console.error("Error in compare-careers API route:", error);
    return new Response("Error generating comparison.", { status: 500 });
  }
}