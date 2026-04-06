import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const BASE = "https://devlens-io.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "DevLens — GitHub Repo Health Scorer",
    template: "%s | DevLens",
  },
  description:
    "Free GitHub repo health scorer. Analyse any public repository across 7 dimensions — README quality, commit activity, CI/CD, documentation, issue response, and community signal. Get a score out of 100 instantly.",
  keywords: [
    "GitHub repo health",
    "repository score",
    "open source quality checker",
    "README analyser",
    "CI/CD checker",
    "commit activity score",
    "GitHub metrics",
    "repo analyser",
    "open source health",
    "developer tools",
  ],
  authors: [{ name: "SamoTech", url: "https://github.com/SamoTech" }],
  creator: "SamoTech",
  publisher: "SamoTech",
  category: "Developer Tools",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  alternates: {
    canonical: BASE,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE,
    siteName: "DevLens",
    title: "DevLens — GitHub Repo Health Scorer",
    description:
      "Free tool to analyse any public GitHub repo across 7 health dimensions. Get an instant score out of 100 — no login, no data stored.",
    images: [
      {
        url: `${BASE}/og.png`,
        width: 1200,
        height: 630,
        alt: "DevLens — GitHub Repo Health Scorer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevLens — GitHub Repo Health Scorer",
    description:
      "Analyse any public GitHub repo across 7 health dimensions. Free, instant, no login.",
    images: [`${BASE}/og.png`],
    creator: "@SamoTech",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DevLens",
    url: BASE,
    description:
      "Free GitHub repo health scorer. Analyse any public repository across 7 weighted dimensions and get an instant score out of 100.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Organization",
      name: "SamoTech",
      url: "https://github.com/SamoTech",
    },
    featureList: [
      "README quality scoring",
      "Commit activity analysis",
      "CI/CD setup detection",
      "Documentation completeness check",
      "Issue response rate",
      "Community signal scoring",
      "Repo freshness rating",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <Nav />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
