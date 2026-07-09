/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Docker image runs `next start` with full dependencies (simple + reliable).
  // For a slimmer production image, set `output: "standalone"` here and run
  // `node .next/standalone/server.js` instead — see README "Production hardening".
  images: {
    // Demo portfolio images are pulled from Unsplash. Swap for your own CDN / storage in production.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  eslint: {
    // Keep container builds green even if lint rules tighten later.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
