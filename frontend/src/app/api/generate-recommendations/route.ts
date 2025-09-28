/**
 * This is the core backend API endpoint for generating personalized career recommendations.
 * It receives user input, constructs a detailed prompt, and streams the response
 * from the Google Gemini AI back to the client.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { type NextRequest } from 'next/server';

// This configuration ensures the function runs on every request, not just once at build time.
export const dynamic = 'force-dynamic';

// Ensures the function runs in a Node.js environment on Vercel
export const runtime = 'nodejs';

/**
 * Handles the GET request to generate career recommendations.
 * @param request The incoming Next.js request object, containing user input in the URL.
 * @returns A streaming response with the AI-generated JSON.
 */
export async function GET(request: NextRequest) {
  try {
    // --- 1. PARSE USER INPUT ---
    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream') || '';
    const skills = searchParams.get('skills')?.split(',') || [];
    const interests = searchParams.get('interests')?.split(',') || [];

    // --- 2. INITIALIZE THE AI MODEL ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // --- FIX: Remove safetySettings for debugging ---
    // The model will use its default safety settings. This is the most likely
    // cause of the crash due to potential SDK version mismatches or API rejection.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      // safetySettings: [
      //   {
      //     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      //     threshold: HarmBlockThreshold.BLOCK_NONE,
      //   },
      //   {
      //     category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      //     threshold: HarmBlockThreshold.BLOCK_NONE,
      //   },
      //   {
      //     category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      //     threshold: HarmBlockThreshold.BLOCK_NONE,
      //   },
      //   {
      //     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      //     threshold: HarmBlockThreshold.BLOCK_NONE,
      //   },
      // ],
    });

    // --- 3. CONSTRUCT THE DETAILED PROMPT ---
    const prompt = `
      You are an expert career and skills advisor. Your task is to provide personalized career path recommendations for a user in India.
      Your entire response MUST be a single, valid JSON object. Do not include any text, markdown formatting, or notes before or after the JSON object.

      The JSON object should have a single key "recommendations", which is an array of 3 career path objects.
      Each career path object must have the following keys:
      - "title": The name of the career path (e.g., "AI/Machine Learning Engineer").
      - "justification": A concise, one-sentence explanation of why it's a good fit for the user.
      - "roadmap": An array of 3-4 strings, with each string being a short, actionable step.
      - "estimatedSalary": A typical annual salary range in India (e.g., "₹8,00,000 - ₹15,00,000 LPA").
      - "suggestedCertifications": An array of 2-3 relevant professional certifications.
      - "keyCompanies": An array of 2-3 notable companies in India that hire for this role.

      User's Profile:
      - Academic Stream: ${academicStream}
      - Skills: ${skills.join(', ')}
      - Interests: ${interests.join(', ')}
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
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error("Error in generate-recommendations API route:", error);
    return new Response("Error generating recommendation.", { status: 500 });
  }
}

