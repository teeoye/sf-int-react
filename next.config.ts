import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker deployment
  // This creates a minimal server.js file for production
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  
  // Optional: Enable experimental features if needed
  // experimental: {
  //   serverActions: true,
  // },
};

export default nextConfig;
