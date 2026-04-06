import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: { default: "DevLens", template: "%s | DevLens" },
  description: "Repo health scoring — 7 dimensions, live from GitHub API.",
  metadataBase: new URL("https://devlens.samotech.dev"),
  openGraph: { siteName: "DevLens", type: "website" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ display:"flex",flexDirection:"column",minHeight:"100dvh" }}>
        <Nav />
        <main style={{ flex:1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}