/**
 * This API endpoint generates personalized career recommendations based on user input.
 * It takes academic stream, skills, and interests, constructs a prompt for the Google Gemini AI,
 * and streams the resulting recommendations back to the client as a structured JSON object.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { type NextRequest } from 'next/server';

// This configuration ensures the function runs on every request.
export const dynamic = 'force-dynamic';

/**
 * Handles the GET request to generate career recommendations.
 * @param request The incoming Next.js request object.
 * @returns A streaming response with the AI-generated JSON.
 */
export async function GET(request: NextRequest) {
  try {
    // --- 1. PARSE USER INPUT ---
    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream');
    const skills = searchParams.get('skills');
    const interests = searchParams.get('interests');

    // Validate that all required inputs were provided.
    if (!academicStream || !skills || !interests) {
      return new Response("Error: Please provide academic stream, skills, and interests.", { status: 400 });
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
    const prompt = `
      You are an expert career advisor. Your task is to provide 3 personalized career recommendations for a user in India based on their profile.
      Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or notes outside of the JSON.

      The JSON object must have a single top-level key: "recommendations".
      - "recommendations": An array of 3 career recommendation objects.

      Each recommendation object in the "recommendations" array must have the following keys:
      - "title": The career title (e.g., "AI Ethics Researcher").
      - "description": A 2-3 sentence overview of the career.
      - "pros": An array of 2-3 strings, each explaining a key benefit or advantage of this career path.
      - "cons": An array of 2-3 strings, each explaining a key challenge or drawback.

      User Profile:
      - Academic Stream: "${academicStream}"
      - Skills: "${skills}"
      - Interests: "${interests}"
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
    console.error("Error in generate-recommendations API route:", error);
    return new Response("Error generating recommendations.", { status: 500 });
  }
}
