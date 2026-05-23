/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Backend may serve document images from any host; allow remote optimization.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
