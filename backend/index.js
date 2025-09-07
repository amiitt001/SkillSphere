// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file

const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Express app
const app = express();
const port = 8080;

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to parse JSON in request bodies

// --- Google Gemini AI Configuration ---
const vertex_ai = new VertexAI({
  project: process.env.GCLOUD_PROJECT_ID,
  location: process.env.GCLOUD_REGION,
});

const generativeModel = vertex_ai.getGenerativeModel({
  model: 'gemini-1.5-pro',
});
// --- End of AI Configuration ---


// --- Helper Function to Call Gemini AI ---
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
    2.  For each path, provide a "title", a concise "justification" (explaining why it's a good fit), and a "roadmap" (a list of 3-5 actionable steps to pursue that career).
    3.  Your entire response MUST be a single, valid JSON object. Do not include any text or markdown formatting before or after the JSON object.
    4.  The JSON object should have a single key "careerPaths", which is an array of the 3 career path objects you identified.
    
    Example JSON format:
    {
      "careerPaths": [
        {
          "title": "Example Career 1",
          "justification": "This fits your profile because...",
          "roadmap": [
            "First step to take.",
            "Second step to take.",
            "Third step to take."
          ]
        },
        {
          "title": "Example Career 2",
          "justification": "This is a great option due to...",
          "roadmap": [
            "Actionable step A.",
            "Actionable step B.",
            "Actionable step C."
          ]
        }
      ]
    }
  `;

  const req = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };

  const result = await generativeModel.generateContent(req);
  const responseText = result.response.candidates[0].content.parts[0].text;
  
  // Clean the response from the AI to ensure it's valid JSON
  const cleanedJsonString = responseText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleanedJsonString);
  } catch (error) {
    console.error("Error parsing JSON from AI:", error);
    throw new Error("The AI returned an invalid response format.");
  }
}
// --- End of Helper Function ---


// --- API Endpoint ---
app.post('/api/generate-recommendations', async (req, res) => {
  console.log('Received request:', req.body);

  const { academicStream, skills, interests } = req.body;

  // Basic validation
  if (!academicStream || !skills || !interests) {
    return res.status(400).json({ error: 'Missing required fields in request body.' });
  }

  try {
    const recommendations = await generateCareerRecommendations(req.body);
    res.json(recommendations);
  } catch (error) {
    console.error('Error in /api/generate-recommendations:', error);
    res.status(500).json({ error: 'An error occurred while communicating with the AI. Please try again later.' });
  }
});
// --- End of API Endpoint ---


// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});