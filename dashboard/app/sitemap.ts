import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://devlens.samotech.dev";
  const pages = ["/","/compare","/docs","/changelog","/about","/faq","/sponsor","/privacy","/terms","/cookies"];
  return pages.map(path => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path==="/" ? "daily" : "weekly", priority: path==="/" ? 1 : 0.7 }));
}