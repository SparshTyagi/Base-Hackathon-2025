/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    // ⚙️ Disable ESLint checks during builds (`next build`)
    ignoreDuringBuilds: true,
  },

  // You can add other config options here as needed
};

module.exports = nextConfig;
