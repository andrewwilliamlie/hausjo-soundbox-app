/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'exceljs', 'nodemailer'],
  experimental: {
    serverActions: { bodySizeLimit: '12mb' }
  },
  poweredByHeader: false,
  // Region lists change only with a new Kemendagri decree; let phones cache them for a day.
  async headers() {
    const day = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      { source: '/wilayah/:file*', headers: day },
      { source: '/mediapipe/:path*', headers: day }
    ];
  }
};

export default nextConfig;
