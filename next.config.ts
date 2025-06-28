import type { NextConfig } from "next";
import { FlatCompat } from '@eslint/eslintrc'
 
const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@next/next/no-page-custom-font': 'off',
    },
  }),
]

export default nextConfig;
