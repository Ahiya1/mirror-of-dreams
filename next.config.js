/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Externalize Anthropic SDK to avoid build-time initialization
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  // Webpack configuration for handling canvas module
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't try to bundle canvas on the client side
      config.externals.push('canvas');
    }
    return config;
  },
};

module.exports = nextConfig;
