/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    appDir: true,
  },
  optimizeFonts: false,
  webpack: (config) => {
    config.externals.push('better-sqlite3');
    return config;
  },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig 