import type { MetadataRoute } from 'next';

const routes = [
  '',
  '/dashboard',
  '/tools',
  '/pricing',
  '/help',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://halodocs.ai';
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
  }));
}

