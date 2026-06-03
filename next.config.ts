import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Optimizado para Vercel */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
