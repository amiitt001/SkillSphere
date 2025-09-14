import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This line tells Next.js to build the site as a collection of static HTML/CSS/JS files
  // which is perfect for Firebase Hosting.
  output: 'export',
};

export default nextConfig;

