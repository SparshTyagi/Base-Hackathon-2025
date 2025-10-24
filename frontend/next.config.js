/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org',
  },
}

module.exports = nextConfig
