import type { MetadataRoute } from "next";

const BASE = "https://devlens-io.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                      lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/compare`,         lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/leaderboard`,     lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/checked`,         lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/docs`,            lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/changelog`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/sponsor`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`,           lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/faq`,             lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,           lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/cookies`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
