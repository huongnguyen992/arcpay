/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@circle-fin/app-kit', 'viem'],
  },
};

module.exports = nextConfig;
