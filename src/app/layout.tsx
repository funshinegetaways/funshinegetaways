import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@/components/Analytics';
import SectionPageShell from '@/components/SectionPageShell';
import { Suspense } from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Royal Enfield Showroom - Funshine Getaways Pvt Ltd | Sivasagar',
    template: '%s | Funshine Getaways',
  },
  description: 'Authorised Royal Enfield dealership in Sivasagar, Assam. Discover the latest motorcycle models, book a test ride, get financing & service.',
  keywords: [
    'Royal Enfield Sivasagar',
    'Royal Enfield Showroom',
    'Funshine Getaways',
    'Hunter 350 Sivasagar',
    'Classic 350 Sivasagar',
    'Bullet 350 Assam',
    'Royal Enfield Test Ride',
    'Royal Enfield Service Sivasagar'
  ],
  authors: [{ name: 'Funshine Getaways Pvt Ltd' }],
  creator: 'Funshine Getaways',
  publisher: 'Funshine Getaways Pvt Ltd',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Royal Enfield Showroom - Funshine Getaways Pvt Ltd',
    description: 'Authorised Royal Enfield dealership in Sivasagar, Assam. Discover latest models, book a test ride, and experience pure motorcycling.',
    type: 'website',
    url: siteUrl,
    siteName: 'Funshine Getaways',
    locale: 'en_IN',
    images: [
      {
        url: `${siteUrl}/assets/images/hunter350.png`,
        alt: 'Funshine Getaways Royal Enfield Showroom Sivasagar',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royal Enfield Showroom - Funshine Getaways Pvt Ltd',
    description: 'Authorised Royal Enfield dealership in Sivasagar, Assam. Book a test ride & explore our motorcycling range.',
    images: [`${siteUrl}/assets/images/hunter350.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: 'Funshine Getaways Pvt Ltd - Authorised Royal Enfield Dealership',
  image: `${siteUrl}/assets/images/showroom.png`,
  '@id': siteUrl,
  url: siteUrl,
  telephone: '+918638707085',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'AT Rd, near ASTC Bus Stand',
    addressLocality: 'Sivasagar',
    addressRegion: 'Assam',
    postalCode: '785640',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 26.9826,
    longitude: 94.6425,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '19:00',
    },
  ],
  sameAs: [
    'https://www.facebook.com',
    'https://www.instagram.com',
  ],
  brand: {
    '@type': 'Brand',
    name: 'Royal Enfield',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              function applyTheme() {
                var theme = localStorage.getItem('siteTheme');
                if (!theme) return;
                var target = document.body || document.documentElement;
                if (target) target.classList.add('theme-' + theme);
              }
              if (document.body) {
                applyTheme();
              } else {
                document.addEventListener('DOMContentLoaded', applyTheme);
              }
            } catch(e) { }
          })();
        `}} />
      </head>
      <body suppressHydrationWarning>
        <SectionPageShell>{children}</SectionPageShell>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
