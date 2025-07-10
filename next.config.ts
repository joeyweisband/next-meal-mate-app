import WithPWA from "next-pwa";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
        port: undefined,
        pathname: '/**',
      },
    ],
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

export default WithPWA(pwaConfig)(nextConfig);