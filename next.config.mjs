/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.resolve.alias.canvas = false;
    return config;
  },
  

  turbopack: {},
}

export default nextConfig
