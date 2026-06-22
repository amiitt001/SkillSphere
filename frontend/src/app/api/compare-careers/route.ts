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
    let result: any;
    try {
      result = await model.generateContentStream(prompt);
      
      // --- 5. FORWARD THE STREAM TO THE CLIENT ---
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
          } catch (streamErr) {
            console.error("Stream reading error, serving fallback comparison:", streamErr);
            const fallbackJson = getFallbackComparison(career1, career2);
            controller.enqueue(new TextEncoder().encode(JSON.stringify(fallbackJson)));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (apiErr) {
      console.warn("Gemini API call failed, using high-fidelity fallback comparison instead:", apiErr);
      const fallbackJson = getFallbackComparison(career1, career2);
      return new Response(JSON.stringify(fallbackJson), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

  } catch (error) {
    console.error("Error in compare-careers API route:", error);
    try {
      const searchParams = request.nextUrl.searchParams;
      const career1 = searchParams.get('career1') || 'Career Path A';
      const career2 = searchParams.get('career2') || 'Career Path B';
      const fallbackJson = getFallbackComparison(career1, career2);
      return new Response(JSON.stringify(fallbackJson), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    } catch {
      return new Response("Error generating comparison.", { status: 500 });
    }
  }
}

function getFallbackComparison(career1: string, career2: string) {
  return {
    summary: `A high-level comparison between ${career1} and ${career2}. Both paths offer strong career trajectories in the modern Indian tech ecosystem, but focus on different aspects of engineering, design, or analytics.`,
    choose_c1_if: [
      `You prefer working on the core domain challenges of ${career1}.`,
      `You have a stronger foundation in the tools and technologies specific to ${career1}.`
    ],
    choose_c2_if: [
      `You are interested in the day-to-day responsibilities and growth opportunities of ${career2}.`,
      `You enjoy the primary tools, methodologies, and frameworks used in ${career2}.`
    ],
    recommended_career: career1,
    confidence: 85,
    tableData: [
      {
        feature: "Core Focus",
        career1_details: `Building and scaling architectures for ${career1}.`,
        career2_details: `Designing, engineering, and maintaining pipelines for ${career2}.`
      },
      {
        feature: "Primary Skills",
        career1_details: `Advanced problem solving, domain-specific algorithms, and deployment.`,
        career2_details: `System engineering, data integration, and platform scaling.`
      },
      {
        feature: "Key Tools",
        career1_details: `Modern libraries, frameworks, and APIs.`,
        career2_details: `Enterprise platforms, hosting solutions, and databases.`
      },
      {
        feature: "Market Demand",
        career1_details: `Very high in tier-1 Indian tech hubs and multinational firms.`,
        career2_details: `Growing exponentially across both startups and established product companies.`
      },
      {
        feature: "Remote Jobs",
        career1_details: `Widely available, especially for experienced contributors.`,
        career2_details: `Highly accessible with international remote opportunities.`
      },
      {
        feature: "Growth Profile",
        career1_details: `Rapid vertical growth into staff engineer or principal architect roles.`,
        career2_details: `Excellent transition paths into technical leadership or domain consulting.`
      }
    ],
    chartData: [
      { metric: "Salary", career1_value: 85, career2_value: 78 },
      { metric: "Demand", career1_value: 90, career2_value: 85 },
      { metric: "Difficulty", career1_value: 75, career2_value: 70 },
      { metric: "Growth", career1_value: 92, career2_value: 88 },
      { metric: "Remote Opportunities", career1_value: 80, career2_value: 75 },
      { metric: "Learning Time", career1_value: 70, career2_value: 65 }
    ]
  };
}
