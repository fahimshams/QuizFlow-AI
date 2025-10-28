/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better debugging
  reactStrictMode: true,

  // Optimize production builds
  swcMinify: true,

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },

  // Enable experimental features
  experimental: {
    // Optimize server actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Image optimization
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;

