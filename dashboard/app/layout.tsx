import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'DevLens — Repo Health Dashboard', template: '%s · DevLens' },
  description: 'Live GitHub repo health scores across 7 dimensions. Free forever.',
  metadataBase: new URL('https://devlens-io.vercel.app'),
  openGraph: {
    title: 'DevLens — Repo Health Dashboard',
    description: 'Live GitHub repo health scores. Free forever.',
    url: 'https://devlens-io.vercel.app',
    siteName: 'DevLens',
    type: 'website'
  },
  twitter: { card: 'summary_large_image', title: 'DevLens', description: 'Repo health in 7 dimensions. Free forever.' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <Nav />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
