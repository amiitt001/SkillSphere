// Import necessary packages
const express = require('express');
const cors = require('cors'); // Make sure 'cors' is required
require('dotenv').config();

// Import our new routes
const recommendationRoutes = require('./routes/recommendationsRoutes');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// --- THIS IS THE FIX ---
// Define which origins are allowed to connect
const allowedOrigins = [
  'https://skillsphere-app.web.app', // Your live frontend
  'http://localhost:3000' // Your local development frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Use the CORS middleware with our options
app.use(cors(corsOptions));
// --- END OF FIX ---


// Middleware setup
app.use(express.json());

// API Routes
app.use('/api', recommendationRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  console.log('✅ CI/CD test: This version was deployed automatically by GitHub Actions!');
});


