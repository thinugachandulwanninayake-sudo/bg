import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The dev overlay would cover the cinematic hero preview.
  devIndicators: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
