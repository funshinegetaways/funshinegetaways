import type { Metadata } from 'next';
import HomeClient from '@/components/HomeClient';

export const metadata: Metadata = {
  title: 'Royal Enfield Showroom | Funshine Getaways',
  description: 'Authorized Royal Enfield dealership in Sivasagar – explore top Royal Enfield models, book a test ride, and discover finance options.',
  openGraph: {
    title: 'Royal Enfield Showroom | Funshine Getaways',
    description: 'Authorized Royal Enfield dealership in Sivasagar – explore top Royal Enfield models, book a test ride, and discover finance options.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Funshine Getaways',
    images: [
      {
        url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/assets/images/hunter350.png` : 'http://localhost:3000/assets/images/hunter350.png',
        alt: 'Funshine Getaways Royal Enfield Showroom',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royal Enfield Showroom | Funshine Getaways',
    description: 'Authorized Royal Enfield dealership in Sivasagar – explore top Royal Enfield models, book a test ride, and discover finance options.',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
