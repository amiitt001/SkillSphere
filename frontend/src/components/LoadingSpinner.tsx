import React from 'react';

const LoadingSpinner = () => {
  return (
    <div role="status" className="flex justify-center items-center">
      <svg
        className="w-20 h-20 animate-spin"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer dashed circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="4"
        />
        {/* The moving arc */}
        <path
          d="M50 5
             A45 45 0 0 1 95 50"
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Inner circle for detail */}
        <circle
            cx="50"
            cy="50"
            r="35"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="2"
        />
        <defs>
            <linearGradient id="gradient" x1="50" y1="5" x2="95" y2="50" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ea5e9" /> {/* sky-500 */}
                <stop offset="1" stopColor="#3b82f6" stopOpacity="0" /> {/* blue-500 to transparent */}
            </linearGradient>
        </defs>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
