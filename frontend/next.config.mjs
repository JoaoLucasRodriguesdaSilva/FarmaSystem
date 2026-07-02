/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera um servidor auto-contido em .next/standalone para imagens Docker enxutas.
  output: 'standalone',
};

export default nextConfig;
