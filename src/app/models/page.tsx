import type { Metadata } from 'next';
import ModelsClient from '@/components/ModelsClient';

export const metadata: Metadata = {
  title: 'Models | Funshine Getaways',
  description: 'Browse our full Royal Enfield motorcycle lineup and discover the model that matches your style and adventure.',
  openGraph: {
    title: 'Models | Funshine Getaways',
    description: 'Browse our full Royal Enfield motorcycle lineup and discover the model that matches your style and adventure.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/models` : 'http://localhost:3000/models',
    siteName: 'Funshine Getaways',
    images: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/assets/images/hunter350.png` : 'http://localhost:3000/assets/images/hunter350.png',
        alt: 'Funshine Getaways Royal Enfield models',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Models | Funshine Getaways',
    description: 'Browse our full Royal Enfield motorcycle lineup and discover the model that matches your style and adventure.',
  },
};

export default function ModelsPage() {
  return <ModelsClient />;
}
