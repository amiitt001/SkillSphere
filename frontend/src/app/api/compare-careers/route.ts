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
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
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
    // summaries, structured recommendation pointers, and comparison metrics.
    const prompt = `
      You are an expert career advisor. Your task is to provide a comparison between two career paths for a user in India.
      Your entire response MUST be a single, valid JSON object. Do not include any text, markdown, or notes outside of the JSON.

      The JSON object must have the following top-level keys: "summary", "choose_c1_if", "choose_c2_if", "recommended_career", "confidence", "tableData", and "chartData".
      - "summary": A 2-3 sentence paragraph comparing the careers at a high level.
      - "choose_c1_if": An array of exactly 2 concise bullet points (strings) explaining why to choose "${career1}".
      - "choose_c2_if": An array of exactly 2 concise bullet points (strings) explaining why to choose "${career2}".
      - "recommended_career": The exact string of the recommended career: "${career1}" or "${career2}".
      - "confidence": A percentage integer score between 60 and 98 representing recommendation confidence.
      - "tableData": An array of objects, where each object represents a row in a comparison table.
      
      Each object in the "tableData" array must have three keys:
      - "feature": The name of the feature being compared (e.g., "Core Focus", "Primary Skills", "Key Tools", "Market Demand", "Remote Jobs", "Growth Profile").
      - "career1_details": The details for the first career, "${career1}".
      - "career2_details": The details for the second career, "${career2}".

      - "chartData": An array of exactly 6 objects comparing the careers across these 6 metrics: "Salary", "Demand", "Difficulty", "Growth", "Remote Opportunities", "Learning Time".
      Each object in the "chartData" array must have:
      - "metric": The name of the metric.
      - "career1_value": A number from 0 to 100 representing the score for "${career1}".
      - "career2_value": A number from 0 to 100 representing the score for "${career2}".

      Generate at least 5-6 feature comparison rows.
      
      CRITICAL JSON FORMATTING RULES:
      1. Do NOT include any trailing commas inside arrays or objects (this is invalid in standard JSON).
      2. Ensure that any double quotes inside string values are properly escaped with a backslash (e.g. \"Python\" instead of "Python").
      3. Do NOT wrap the JSON inside markdown tags (like \`\`\`json ... \`\`\`). Just output the raw JSON starting with an opening curly bracket and ending with a closing curly bracket.
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
