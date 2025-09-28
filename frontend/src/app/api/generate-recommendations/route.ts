import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handles the GET request to generate career recommendations by calling the Google AI API directly.
 * This version uses the standard, non-streaming endpoint for maximum compatibility.
 */
export async function GET(request: NextRequest) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("CRITICAL: The GEMINI_API_KEY was not found in the environment variables.");
      return new Response("Error: Server is missing the required GEMINI API KEY.", { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream') || '';
    const skills = searchParams.get('skills')?.split(',') || [];
    const interests = searchParams.get('interests')?.split(',') || [];

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

    // --- FIX: Use the standard non-streaming endpoint ---
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Error from Google AI API:", errorText);
      // Forward the exact error status and message from Google
      return new Response(errorText, { status: apiResponse.status });
    }

    // --- FIX: Handle the non-streaming JSON response ---
    const responseJson = await apiResponse.json();
    
    // Extract the text content from the AI's response
    const aiResponseText = responseJson.candidates[0].content.parts[0].text;
    
    // Return the clean JSON text to the client
    return new Response(aiResponseText, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error) {
    console.error("CRITICAL ERROR in generate-recommendations API route:", error);
    return new Response("A critical error occurred on the server.", { status: 500 });
  }
}

