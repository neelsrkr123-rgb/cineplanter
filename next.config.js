/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Cloudinary images
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
      // YouTube thumbnails
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      // Google user avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    minimumCacheTTL: 60, // optional cache time in seconds
  },
};

module.exports = nextConfig;
