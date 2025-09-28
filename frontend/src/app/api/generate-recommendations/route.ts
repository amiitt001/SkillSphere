import { type NextRequest } from 'next/server';

// This configuration ensures the function runs on every request, not just once at build time.
export const dynamic = 'force-dynamic';

// Ensures the function runs in a Node.js environment on Vercel
export const runtime = 'nodejs';

/**
 * Handles the GET request to generate career recommendations by calling the Google AI API directly.
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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    // --- 2. CONSTRUCT THE PROMPT AND REQUEST BODY ---
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

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
    };

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${apiKey}`;

    // --- 3. CALL THE API DIRECTLY USING FETCH ---
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("Google API Error:", errorBody);
        throw new Error(`API request failed with status ${apiResponse.status}: ${errorBody}`);
    }

    // --- 4. FORWARD THE STREAM TO THE CLIENT ---
    // The native fetch response body is already a ReadableStream, so we can return it directly.
    return new Response(apiResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error("Error in generate-recommendations API route:", error);
    return new Response("Error generating recommendation.", { status: 500 });
  }
}

