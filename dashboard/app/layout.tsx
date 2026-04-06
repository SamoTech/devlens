import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "DevLens Dashboard",
  description: "Repo health scoring — 7 dimensions, live from GitHub API",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}