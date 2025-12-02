const DEFAULT_API_BASE = 'http://localhost:8080';

// Simple API base - no version prefix
const apiBase = (process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Cloud Run deployment
  output: 'standalone',
  
  reactStrictMode: false, // Disable strict mode to prevent React 19 issues
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds for now
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors
  },

  // Chrome localhost compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Skip static generation for error pages
  trailingSlash: false,
  generateEtags: false,

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei'],
    optimizeCss: true,
    scrollRestoration: true,
  },

  env: {
    NEXT_PUBLIC_API_BASE: apiBase,
  },

  async rewrites() {
    return [
      // Proxy tool API requests to backend
      {
        source: '/api/tools/:path*',
        destination: `${apiBase}/api/tools/:path*`,
      },
      // Proxy health check
      {
        source: '/api/health',
        destination: `${apiBase}/health`,
      },
    ];
    // Note: /api/ai/* routes are handled by local Next.js API routes in app/api/ai/
  },

  // Simplified webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Basic fallbacks for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'fs': false,
        'path': false,
        'crypto': false,
        'canvas': false,  // Required for pdfjs-dist browser usage
      };
    }

    // Ignore canvas module for pdfjs-dist
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    return config;
  },
};

module.exports = nextConfig;
