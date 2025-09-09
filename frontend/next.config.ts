import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // We are removing the 'output: export' and 'images' configurations.
  // This will revert to the default, more flexible server-side rendering mode
  // which is better suited for deployment on Firebase Hosting.
};

export default nextConfig;

