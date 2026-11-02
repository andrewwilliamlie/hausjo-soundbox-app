import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Soundbox QRIS HausJo – Setiap pembayaran QRIS, ada suaranya',
  description:
    'Daftar Soundbox QRIS atau QRIS gratis dari HausJo. QRIS aktif dalam 1–2 hari kerja. MDR 0% untuk transaksi di bawah Rp500.000 (pencairan H+1).'
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0B2253' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={font.className}>{children}</body>
    </html>
  );
}
