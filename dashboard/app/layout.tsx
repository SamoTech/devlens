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
    default: "DevLens — GitHub Repository Intelligence",
    template: "%s | DevLens",
  },
  description:
    "Free GitHub repository intelligence for health, security, code quality, activity, documentation, and community signals. Analyze public repositories with transparent evidence and confidence.",
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
    title: "DevLens — GitHub Repository Intelligence",
    description:
      "Analyze any public GitHub repository across 9 health dimensions, plus security and code-quality intelligence. Free and evidence-driven.",
    images: [
      {
        url: `${BASE}/og.png`,
        width: 1200,
        height: 630,
        alt: "DevLens — GitHub Repository Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevLens — GitHub Repository Intelligence",
    description:
      "Analyze any public GitHub repository across 9 health dimensions, plus security and code-quality intelligence. Free and instant.",
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
      "Free GitHub repository intelligence across 9 weighted health dimensions, with security and code-quality analysis.",
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
      "Issue response and maintenance analysis",
      "Community signal analysis",
      "Repo freshness rating",
      "PR velocity analysis",
      "Security and code-quality intelligence",
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
