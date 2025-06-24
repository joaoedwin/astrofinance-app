/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    missingSuspenseWithCSRBailout: false,
  },
  optimizeFonts: false,
  staticPageGenerationTimeout: 300,
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
        has: [
          {
            type: 'header',
            key: 'x-invoke-path',
            value: '/api/.+',
          },
        ],
      },
    ];
  },
  serverRuntimeConfig: {
    api: {
      bodyParser: true,
      externalResolver: true,
    },
  },
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 