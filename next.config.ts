import type { NextConfig } from 'next';
import withFlowbiteReact from 'flowbite-react/plugin/nextjs';

const nextConfig: NextConfig = {
  // Security Headers Configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://localhost:* ws://localhost:* wss://localhost:*",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  
  // Image Configuration with Security
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flowbite.com',
        port: '',
        pathname: '/docs/**',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
        port: '',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Force HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production' 
      ? [
          {
            source: '/(.*)',
            destination: 'https://knowledge-advisor-enterprise.vercel.app/$1',
            permanent: true,
            has: [
              {
                type: 'header',
                key: 'x-forwarded-proto',
                value: 'http',
              },
            ],
          },
        ]
      : [];
  },
  
  output: 'standalone',
  
  // Server External Packages
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default withFlowbiteReact(nextConfig);
