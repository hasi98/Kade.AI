import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static2.kapruka.com",
      },
      {
        protocol: "https",
        hostname: "static.kapruka.com",
      },
      {
        protocol: "https",
        hostname: "www.kapruka.com",
      },
    ],
  },
  devIndicators: false
};

export default nextConfig;
