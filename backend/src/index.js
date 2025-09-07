// Import necessary packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import our new routes
const recommendationRoutes = require('./routes/recommendationsRoutes');

// Initialize Express app
const app = express();
const port = process.env.PORT || 8080; // Use port from .env or default to 8080

// Middleware setup
app.use(cors());
app.use(express.json());

// --- API Routes ---
// Tell the app to use our recommendation routes for any path starting with /api
app.use('/api', recommendationRoutes);
// --- End of API Routes ---

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
