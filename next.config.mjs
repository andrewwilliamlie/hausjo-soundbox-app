/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'exceljs', 'nodemailer'],
  experimental: {
    serverActions: { bodySizeLimit: '12mb' }
  },
  poweredByHeader: false
};

export default nextConfig;
