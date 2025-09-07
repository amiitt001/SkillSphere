const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendationsController');

// Define the POST route for generating recommendations
router.post('/generate-recommendations', recommendationsController.getRecommendations);

module.exports = router;
