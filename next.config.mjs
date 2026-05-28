/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.resolve.alias.canvas = false;
    return config;
  },
  

  turbopack: {},

  // Increase the HTTP server's max header size to fix 431 errors caused by
  // large NextAuth JWT session cookies exceeding the default 8KB Node.js limit.
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
}

export default nextConfig
