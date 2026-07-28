"use client";

import { useEffect } from 'react';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
}

const defaultSiteName = 'Funshine Getaways';
const defaultDescription = 'Discover Royal Enfield motorcycles, finance options, test rides, and service at Funshine Getaways showroom.';
const defaultImage = '/assets/images/hunter350.png';

function toAbsoluteUrl(value?: string) {
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value)) return value;
  if (typeof window === 'undefined') return value;
  return new URL(value, window.location.origin).toString();
}

export default function SeoHead({
  title,
  description = defaultDescription,
  image = defaultImage,
  url,
  type = 'website',
  siteName = defaultSiteName,
  twitterCard = 'summary_large_image',
}: SeoHeadProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const resolvedTitle = title ? `${title} | ${siteName}` : siteName;
    const resolvedUrl = toAbsoluteUrl(url || (typeof window !== 'undefined' ? window.location.href : ''));
    const resolvedImage = toAbsoluteUrl(image);

    document.title = resolvedTitle;

    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const setProperty = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('description', description);
    setProperty('og:title', resolvedTitle);
    setProperty('og:description', description);
    setProperty('og:type', type);
    setProperty('og:site_name', siteName);
    setProperty('og:image', resolvedImage || defaultImage);
    if (resolvedUrl) setProperty('og:url', resolvedUrl);

    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', resolvedTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', resolvedImage || defaultImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    if (resolvedUrl) canonical.setAttribute('href', resolvedUrl);
  }, [title, description, image, url, type, siteName, twitterCard]);

  return null;
}
