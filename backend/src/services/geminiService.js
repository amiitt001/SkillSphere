const { VertexAI } = require('@google-cloud/vertexai');

// AI Configuration (unchanged)
const vertex_ai = new VertexAI({
  project: process.env.GCLOUD_PROJECT_ID,
  location: process.env.GCLOUD_REGION,
});
const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-1.0-pro' });

async function generateCareerRecommendations(userInput) {
  const { academicStream, skills, interests } = userInput;

  // Prompt is unchanged
  const prompt = `
    You are an expert career and skills advisor named "SkillSphere".
    Your task is to provide personalized career path recommendations for a user in India based on their academic stream, skills, and interests.

    User's Profile:
    - Academic Stream: ${academicStream}
    - Skills: ${skills.join(', ')}
    - Interests: ${interests.join(', ')}

    Instructions:
    1.  Analyze the user's profile to identify 3 distinct and relevant career paths.
    2.  For each path, provide the following information:
        - "title": The name of the career path.
        - "justification": A concise explanation of why it's a good fit for the user.
        - "roadmap": A list of 3-5 actionable steps to pursue that career.
        - "estimatedSalary": A typical annual salary range for this role in India (e.g., "₹8,00,000 - ₹15,00,000 LPA").
        - "suggestedCertifications": A list of 2-3 relevant professional certifications.
        - "keyCompanies": A list of 2-3 notable companies in India that hire for this role.
    3.  Your entire response MUST be a single, valid JSON object with a single key "careerPaths". Do not include any text, markdown formatting, or notes before or after the JSON object.
    
    Example JSON format:
    {
      "careerPaths": [
        {
          "title": "Example Career",
          "justification": "This fits your profile because...",
          "roadmap": ["First step.", "Second step."],
          "estimatedSalary": "₹X,XX,XXX - ₹Y,YY,YYY LPA",
          "suggestedCertifications": ["Certification A", "Certification B"],
          "keyCompanies": ["Company X", "Company Y"]
        }
      ]
    }
  `;

  const req = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      "responseMimeType": "application/json",
    }
  };

  try {
    // --- THIS IS THE MODIFIED PART ---
    // 1. Use generateContentStream instead of generateContent
    const streamResult = await generativeModel.generateContentStream(req);

    // 2. Aggregate the streamed chunks into a single string
    let responseText = '';
    for await (const item of streamResult.stream) {
      if (item.candidates && item.candidates[0].content && item.candidates[0].content.parts[0]) {
         responseText += item.candidates[0].content.parts[0].text;
      }
    }

    // 3. Parse the fully assembled JSON string
    return JSON.parse(responseText);

  } catch (error) {
    console.error("Error communicating with Gemini AI:", error);
    throw new Error("Failed to get a valid response from the AI service.");
  }
}

module.exports = {
  generateCareerRecommendations,
};