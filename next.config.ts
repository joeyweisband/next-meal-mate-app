import WithPWA from "next-pwa";

const nextConfig = {
  // Add this to disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    // Skip type checking during build (faster)
    ignoreBuildErrors: true,
  },

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
  
  // Moved to serverExternalPackages as per Next.js 15
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@prisma/client', '@prisma/engines'];
    }
    
    // Replace null-loader with this approach
    config.module.rules.push({
      test: /\.js$/,
      include: /src\/generated\/prisma/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });
    
    return config;
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

export default WithPWA(pwaConfig)(nextConfig);