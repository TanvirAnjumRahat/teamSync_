/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,   // ← ADD THIS LINE
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;