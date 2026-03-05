/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.zeabur.app',
        pathname: '/content/images/**',
      },
      {
        protocol: 'https',
        hostname: 'doriritohappydays.ghost.io',
      },
      {
        protocol: 'https',
        hostname: 'static.ghost.org',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
