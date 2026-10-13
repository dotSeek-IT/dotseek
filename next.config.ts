import type { NextConfig } from "next";

// Server mode (next build && next start): required for the AI assistant's
// /api/assistant route, which keeps the Anthropic API key on the server.
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
