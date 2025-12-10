/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

// Security headers to protect against common web vulnerabilities
const securityHeaders = [
  {
    // Prevent XSS attacks by enabling browser's built-in XSS filter
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Prevent clickjacking by denying iframe embedding
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Control referrer information sent with requests
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Restrict access to sensitive browser features
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

// Add HSTS header in production to enforce HTTPS
if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Redirect old URL patterns to new ones
  async redirects() {
    return [
      {
        // Redirect /reflections/view?id=xxx to /reflections/xxx
        source: '/reflections/view',
        has: [
          {
            type: 'query',
            key: 'id',
          },
        ],
        destination: '/reflections/:id',
        permanent: true,
      },
    ];
  },
  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
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

// Wrap with Sentry config for error monitoring and source map uploads
module.exports = withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppresses source map upload logs during build
  silent: true,

  // Routes browser source maps to Sentry
  widenClientFileUpload: true,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Tree shaking for smaller bundles
  disableLogger: true,

  // Automatically set release to git commit SHA
  automaticVercelMonitors: true,
});
