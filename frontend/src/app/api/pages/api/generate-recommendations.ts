import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Handles the GET request to generate career recommendations in a Next.js Pages Router environment.
 * This is the definitive, final version.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("CRITICAL: The GEMINI_API_KEY was not found in the environment variables.");
      return res.status(500).json({ error: "Server is missing the required GEMINI API KEY." });
    }

    // In Pages Router, query parameters are directly on req.query
    const { academicStream, skills, interests } = req.query;

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
      - Academic Stream: ${academicStream || ''}
      - Skills: ${skills || ''}
      - Interests: ${interests || ''}
    `;

    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

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
      return res.status(apiResponse.status).json({ error: errorText });
    }

    const responseJson = await apiResponse.json();
    const aiResponseText = responseJson.candidates[0].content.parts[0].text;
    
    // Set the header and send the successful response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(aiResponseText);

  } catch (error) {
    console.error("CRITICAL ERROR in generate-recommendations API route:", error);
    return res.status(500).json({ error: "A critical error occurred on the server." });
  }
}

