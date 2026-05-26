import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — re-enable for Docker/Hetzner deploy (Block 12)
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
