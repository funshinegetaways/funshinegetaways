import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@/components/Analytics';
import SectionPageShell from '@/components/SectionPageShell';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Royal Enfield Showroom - Funshine Getaways pvt ltd',
  description: 'Authorised Royal Enfield dealership in Sivasagar. Discover the latest models, book a test ride, and experience the thrill of riding.',
  openGraph: {
    title: 'Royal Enfield Showroom - Funshine Getaways pvt ltd',
    description: 'Authorised Royal Enfield dealership in Sivasagar. Discover the latest models, book a test ride, and experience the thrill of riding.',
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
    title: 'Royal Enfield Showroom - Funshine Getaways pvt ltd',
    description: 'Authorised Royal Enfield dealership in Sivasagar. Discover the latest models, book a test ride, and experience the thrill of riding.',
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
