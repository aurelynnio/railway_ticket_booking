import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // Allow high-quality re-encoding (default only permits 75, which made the
    // hero illustration look soft/blurry). Keep 75 as a lower tier for thumbs.
    qualities: [100, 75],
  },
};

export default nextConfig;
