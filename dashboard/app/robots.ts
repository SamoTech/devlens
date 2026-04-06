import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://devlens-io.vercel.app/sitemap.xml",
    host: "https://devlens-io.vercel.app",
  };
}
