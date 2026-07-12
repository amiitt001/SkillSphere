/**
 * Career Prompts Library
 */

export const getRecommendationsPrompt = (academicStream: string, skills: string, interests: string) => `
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
- "skillGapAnalysis": A JSON object containing:
  - "readinessScore": An integer score (0-100) representing readiness.
  - "estimatedTime": Estimated time to become ready (e.g., "4-6 Months").
  - "currentSkills": Array of strings matching user skills that are relevant to this career.
  - "missingSkills": Array of objects representing missing skills. Each object has "name" (string) and "level" (number, 0-60 representing current partial exposure).
  - "topPrioritySkills": Array of top 3 priority skills to learn.
  - "aiInsight": A concise personalized career recommendation insight under 25 words.

User's Profile:
- Academic Stream: ${academicStream}
- Skills: ${skills}
- Interests: ${interests}
`.trim();

export const getComparisonPrompt = (career1: string, career2: string) => `
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
2. Ensure that any double quotes inside string values are properly escaped with a backslash (e.g. \\"Python\\" instead of "Python").
3. Do NOT wrap the JSON inside markdown tags (like \`\`\`json ... \`\`\`). Just output the raw JSON starting with an opening curly bracket and ending with a closing curly bracket.
`.trim();
