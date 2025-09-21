/**
 * This file contains the LoadingSpinner component, a reusable UI element
 * for indicating that an operation is in progress.
 */
import React from 'react';

/**
 * A visually appealing, animated loading spinner created with SVG.
 * It is used to provide feedback to the user during asynchronous operations
 * like fetching data from the AI.
 */
const LoadingSpinner = () => {
  // --- RENDER ---
  return (
    <div role="status" className="flex justify-center items-center">
      <svg
        className="w-20 h-20 animate-spin text-sky-500" // Use a base color for accessibility
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* A faint, full circle that provides the track for the spinner. */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="4"
        />

        {/* The main spinning arc, which is styled with a gradient. */}
        <path
          d="M50 5
             A45 45 0 0 1 95 50" // This defines a quarter-circle arc
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Defines the gradient used to color the spinning arc. */}
        <defs>
          <linearGradient id="gradient" x1="50" y1="5" x2="95" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0ea5e9" /> {/* Starts with a solid sky blue */}
              <stop offset="1" stopColor="#3b82f6" stopOpacity="0" /> {/* Fades to a transparent blue */}
          </linearGradient>
        </defs>
      </svg>
      {/* Screen reader text for accessibility */}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;

