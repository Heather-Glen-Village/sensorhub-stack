import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  // You can also add other config options here
};

export default nextConfig;
