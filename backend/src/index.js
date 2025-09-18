const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// ... other imports

dotenv.config();
const app = express();

// --- START: CORS CONFIGURATION ---
// 1. Define the list of allowed origins (your live frontend and local dev environment)
const allowedOrigins = [
  'https://skillsphere-app-d03b7.web.app',
  'http://localhost:3000'
];

// 2. Create the CORS options object
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

// 3. Apply the CORS middleware with your options
app.use(cors(corsOptions));
// --- END: CORS CONFIGURATION ---


// --- Your other middleware and routes ---
app.use(express.json());
// ... your routes like app.use('/api', recommendationRoutes);

// CORRECT VERSION
const recommendationRoutes = require('./routes/recommendationsRoutes');
app.use('/api', recommendationRoutes); // This adds the crucial prefix

// ... your server listen code
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});