import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Transpile the SDK package
  transpilePackages: ['@arklabs/wallet-sdk'],
}

export default nextConfig
