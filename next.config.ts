import type { NextConfig } from "next";

// Static export: the site is plain files, and the browser queries the public Tiramisu RPC directly.
// There is no Sakshi backend to take down. NEXT_PUBLIC_BASE_PATH is "/sakshi" on GitHub Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_BOARD_PHASE: process.env.NEXT_PUBLIC_BOARD_PHASE === "2" ? "2" : "1",
  },
};

export default nextConfig;
