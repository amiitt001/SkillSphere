const { VertexAI } = require('@google-cloud/vertexai');

// --- Google Gemini AI Configuration ---
const vertex_ai = new VertexAI({
  project: process.env.GCLOUD_PROJECT_ID,
  location: process.env.GCLOUD_REGION,
});

const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-1.0-pro', // Using the stable model
});
// --- End of AI Configuration ---

async function generateCareerRecommendations(userInput) {
  const { academicStream, skills, interests } = userInput;

  // A detailed prompt for the AI
  const prompt = `
    You are an expert career and skills advisor named "SkillSphere".
    Your task is to provide personalized career path recommendations based on a user's academic stream, skills, and interests.

    User's Profile:
    - Academic Stream: ${academicStream}
    - Skills: ${skills.join(', ')}
    - Interests: ${interests.join(', ')}

    Instructions:
    1.  Analyze the user's profile to identify 3 distinct and relevant career paths.
    2.  For each path, provide a "title", a concise "justification", and a "roadmap" (a list of 3-5 actionable steps).
    3.  Your entire response MUST be a single, valid JSON object with a single key "careerPaths".
  `;

  const req = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      "responseMimeType": "application/json",
    }
  };

  try {
    const result = await generativeModel.generateContent(req);
    const responseText = result.response.candidates[0].content.parts[0].text;
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error communicating with Gemini AI:", error);
    throw new Error("Failed to get a valid response from the AI service.");
  }
}

// Export the function so other files can use it
module.exports = {
  generateCareerRecommendations,
};
