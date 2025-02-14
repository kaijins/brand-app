/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  reactStrictMode: true,
  // 以下を追加
  experimental: {
    appDir: true
  }
};

module.exports = withPWA(nextConfig);