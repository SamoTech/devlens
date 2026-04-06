import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://devlens-io.vercel.app';
  const pages = ['', '/compare', '/about', '/faq', '/docs', '/changelog', '/sponsor', '/terms', '/privacy', '/cookies'];
  return pages.map(path => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
