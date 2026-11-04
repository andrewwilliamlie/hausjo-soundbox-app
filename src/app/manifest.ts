import type { MetadataRoute } from 'next';

// Lets merchants add AIPOS to their home screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AIPOS Merchant',
    short_name: 'AIPOS',
    description: 'QRIS dan Soundbox QRIS untuk usaha Anda',
    start_url: '/app',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0069FC',
    icons: [{ src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }]
  };
}
