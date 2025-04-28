/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  
  // Enable features for better audio handling
  serverExternalPackages: ['child_process', 'fs', 'path'],
  outputFileTracingExcludes: {
    '/api/transcribe-chunk': ['node_modules/**'],
  },
  
  // Configure headers for CORS and other security policies
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  
  // Configure webpack for FFmpeg
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
}

module.exports = nextConfig 