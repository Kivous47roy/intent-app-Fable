import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Intent',
    short_name: 'Intent',
    description: 'Five short writing rituals. One quiet practice.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f0e8',
    theme_color: '#f4f0e8',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
