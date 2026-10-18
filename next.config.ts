import type { NextConfig } from "next";

// The DEMO board serves stable URLs (/board/notice-N.pdf) whose content depends on the build-time
// phase: phase 1 = as first published, phase 2 = notice-2 edited and notice-3 removed (404).
export const BOARD_PHASE = process.env.NEXT_PUBLIC_BOARD_PHASE === "2" ? "2" : "1";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BOARD_PHASE: BOARD_PHASE },
  async rewrites() {
    return [{ source: "/board/:file(notice-\\d+\\.pdf)", destination: `/board-files/v${BOARD_PHASE}/:file` }];
  },
};

export default nextConfig;
