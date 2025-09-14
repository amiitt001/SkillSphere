// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import our routes
const recommendationRoutes = require('./routes/recommendationsRoutes');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080;

// --- THIS IS THE FIX ---
// Define the specific domains (origins) that are allowed to connect to this backend.
const allowedOrigins = [
  'https://skillsphere-app.web.app', // Your LIVE frontend URL
  'http://localhost:3000'             // Your LOCAL development frontend URL
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

// Use the CORS middleware with our specific options
app.use(cors(corsOptions));
// --- END OF FIX ---


// Standard middleware
app.use(express.json());

// API Routes
app.use('/api', recommendationRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

