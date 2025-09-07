const geminiService = require('../services/geminiService');

const getRecommendations = async (req, res) => {
  console.log('Received request:', req.body);

  const { academicStream, skills, interests } = req.body;

  // Basic validation
  if (!academicStream || !skills || !interests) {
    return res.status(400).json({ error: 'Missing required fields in request body.' });
  }

  try {
    const recommendations = await geminiService.generateCareerRecommendations(req.body);
    res.json(recommendations);
  } catch (error) {
    console.error('Error in recommendations controller:', error);
    res.status(500).json({ error: 'An internal error occurred while generating recommendations.' });
  }
};

module.exports = {
  getRecommendations,
};
