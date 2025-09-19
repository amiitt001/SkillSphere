// controllers/recommendationsController.js - NEW VERSION

const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Initialize with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getRecommendations = async (req, res) => {
  try {
    const { academicStream, skills, interests } = req.body;

    // 2. The prompt is the same, but remove the demand for JSON.
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
    
    // 3. Get the model and start the stream
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContentStream(prompt);

    // 4. Set headers and stream the response to the client
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }

    res.end();

  } catch (error) {
    console.error("Error in getRecommendations stream:", error);
    res.status(500).send("Error generating streaming recommendation.");
  }
};

module.exports = {
  getRecommendations,
};