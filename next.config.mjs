/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/users", destination: "/settings/access-control/users", permanent: false },
      { source: "/policies", destination: "/policies/repository", permanent: false },
      { source: "/research", destination: "/research/grant-calls", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/policies/concept-notes/my-concept-note/:id/edit",
        destination: "/policies/concept-notes/my-concept-note/edit/:id",
      },
    ];
  },
  webpack(config) {
    config.resolve.alias.canvas = false;
    config.resolve.alias.inherits = path.join(__dirname, "shims/inherits.cjs");
    config.resolve.alias["trim-canvas"] = path.join(
      __dirname,
      "shims/trim-canvas.cjs",
    );
    return config;
  },

  turbopack: {
    resolveAlias: {
      inherits: "./shims/inherits.cjs",
      "trim-canvas": "./shims/trim-canvas.cjs",
    },
  },

  // Increase the HTTP server's max header size to fix 431 errors caused by
  // large NextAuth JWT session cookies exceeding the default 8KB Node.js limit.
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "pgms.mohdigitalhealth.gov.et",
        "196.190.220.91:8089",
      ],
    },
  },
}

export default nextConfig
