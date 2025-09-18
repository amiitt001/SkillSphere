const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex AI
const vertex_ai = new VertexAI({
  project: process.env.GCLOUD_PROJECT_ID,
  location: process.env.GCLOUD_REGION,
});

// Get the generative model
const generativeModel = vertex_ai.getGenerativeModel({ model: 'gemini-1.0-pro' });

// This is the main function that will be called by your route
const getRecommendations = async (req, res) => {
  try {
    const { academicStream, skills, interests } = req.body;

    // --- IMPORTANT: The prompt is now adjusted for a text stream ---
    // Instead of demanding a JSON object, we ask for a human-readable response.
    const prompt = `
      You are an expert career and skills advisor named "SkillSphere".
      Your task is to provide personalized career path recommendations for a user in India based on their academic stream, skills, and interests.
      The response should be well-formatted as markdown text, suitable for direct display to the user.

      User's Profile:
      - Academic Stream: ${academicStream}
      - Skills: ${skills.join(', ')}
      - Interests: ${interests.join(', ')}

      Instructions:
      1.  Analyze the user's profile to identify 3 distinct and relevant career paths.
      2.  For each path, provide a clear title and a few paragraphs explaining:
          - Why it's a good fit for the user.
          - A brief roadmap of actionable steps.
          - A typical salary range in India (LPA).
      3.  Format the entire output clearly using markdown (e.g., using ### for titles and bullet points for lists).
    `;
    
    const reqForStreaming = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };

    // Call the streaming API
    const streamResult = await generativeModel.generateContentStream(reqForStreaming);

    // Set headers for a streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Stream each chunk to the browser
    for await (const item of streamResult.stream) {
      if (item.candidates && item.candidates[0].content && item.candidates[0].content.parts[0]) {
        const chunkText = item.candidates[0].content.parts[0].text;
        res.write(chunkText);
      }
    }

    // End the response when the stream is finished
    res.end();

  } catch (error) {
    console.error("Error in getRecommendations stream:", error);
    // Send a final error message if something goes wrong
    res.status(500).end("Error generating streaming recommendation.");
  }
};

module.exports = {
  getRecommendations,
};