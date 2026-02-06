import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pg', '@prisma/adapter-pg'],
};

export default nextConfig;
