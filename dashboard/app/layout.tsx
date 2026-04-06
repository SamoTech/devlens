import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevLens — Repo Health Dashboard',
  description: 'Live GitHub repo health scores across 7 dimensions. Free forever.',
  openGraph: {
    title: 'DevLens — Repo Health Dashboard',
    description: 'Live GitHub repo health scores. Free forever.',
    url: 'https://devlens-io.vercel.app',
    siteName: 'DevLens'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
