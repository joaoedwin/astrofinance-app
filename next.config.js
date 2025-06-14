/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  webpack: (config) => {
    config.externals.push('better-sqlite3');
    return config;
  },
  output: 'standalone'
}

module.exports = nextConfig 