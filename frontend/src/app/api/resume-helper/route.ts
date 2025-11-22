/**
 * This API endpoint powers the "AI Resume Co-Pilot" feature.
 * It receives a user's skills and a job description, constructs a prompt
 * for the Google Gemini AI to generate tailored resume bullet points,
 * and streams the response back to the client.
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { type NextRequest, NextResponse } from 'next/server';

// This configuration ensures the function runs on every request.
export const dynamic = 'force-dynamic';

/**
 * Handles the POST request to generate resume bullet points.
 * @param request The incoming Next.js request object.
 * @returns A streaming response with the AI-generated markdown text.
 */
export async function POST(request: NextRequest) {
  try {
    // --- 1. PARSE USER INPUT ---
    // Extract the user's skills and the target job description from the request body.
    const { skills, jobDescription } = await request.json();

    // Validate that the required data was provided.
    if (!skills || !jobDescription) {
      return NextResponse.json({ error: 'Missing skills or job description.' }, { status: 400 });
    }

    // --- 2. INITIALIZE THE AI MODEL ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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
    // This prompt instructs the AI to act as a career coach and generate
    // powerful, action-oriented resume bullet points that connect the user's
    // skills to the specific requirements of the job description.
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
    // Log the error for debugging on the server
    console.error("Error in resume-helper API route:", error);
    // Return a generic error response to the client
    return NextResponse.json({ error: 'Failed to generate resume points.' }, { status: 500 });
  }
}
