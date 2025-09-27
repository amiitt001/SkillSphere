/**
 * This API endpoint generates a detailed comparison between two career paths.
 * It takes two career titles as input, constructs a prompt for the Google Gemini AI,
 * and streams the resulting comparison back to the client as a structured JSON object.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { type NextRequest } from 'next/server';

// This configuration ensures the function runs on every request.
export const dynamic = 'force-dynamic';

/**
 * Handles the GET request to generate a career comparison.
 * @param request The incoming Next.js request object.
 * @returns A streaming response with the AI-generated JSON.
 */
export async function GET(request: NextRequest) {
  try {
    // --- 1. PARSE USER INPUT ---
    const searchParams = request.nextUrl.searchParams;
    const career1 = searchParams.get('career1');
    const career2 = searchParams.get('career2');

    // Validate that both career titles were provided.
    if (!career1 || !career2) {
      return new Response("Error: Please provide two careers to compare.", { status: 400 });
    }

    // --- 2. INITIALIZE THE AI MODEL ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

    // --- 3. CONSTRUCT THE DETAILED PROMPT ---
    // This prompt instructs the AI to return a structured JSON object containing
    // a summary and data formatted for a comparison table.
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
    
    // --- 4. CALL THE AI AND GET A STREAMING RESPONSE ---
    const result = await model.generateContentStream(prompt);

    // --- 5. FORWARD THE STREAM TO THE CLIENT ---
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
