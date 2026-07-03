import type { Metadata, Viewport } from 'next';
import { Fraunces, Newsreader, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Intent',
  description: 'Five short writing rituals. One quiet practice.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Intent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4f0e8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${newsreader.variable} ${jetbrains.variable}`}>
        <div className="paper-grain" />
        <div className="app-shell">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
