import type { NextConfig } from "next";

// Server mode (next build && next start): required for the AI assistant's
// /api/assistant route, which keeps the Anthropic API key on the server.
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  // Pages may only be embedded by this site (the chat shows the private enquiry page in a modal);
  // other sites can't frame the enquiry or admin pages (clickjacking protection).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
