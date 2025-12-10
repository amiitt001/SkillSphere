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
      <div className="relative w-20 h-20">
        {/* Outer rotating circle */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 border-r-blue-500 animate-spin"></div>
        
        {/* Middle pulsing circle */}
        <div className="absolute inset-2 rounded-full border-2 border-sky-400/30 animate-pulse"></div>
        
        {/* Inner gradient circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-sky-400 rounded-full"></div>
      </div>

      {/* Screen reader text for accessibility */}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;

