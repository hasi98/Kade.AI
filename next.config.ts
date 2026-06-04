import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.kapruka.com" },
      { protocol: "https", hostname: "kapruka.com" }
    ]
  }
};

export default nextConfig;
