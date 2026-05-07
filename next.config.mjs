import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/icon-light-32x32.png",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/icon-dark-32x32.png",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/apple-icon.png",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
    ];
  },
}

export default nextConfig
