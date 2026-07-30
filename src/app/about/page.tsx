import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About Us | 18 Years of Royal Enfield Legacy',
  description: 'Learn about Funshine Getaways Pvt Ltd, authorised Royal Enfield dealership in Sivasagar. Serving over 5,000 happy riders with sales, service, and accessories.',
  openGraph: {
    title: 'About Us | 18 Years of Royal Enfield Legacy',
    description: 'Authorised Royal Enfield dealership in Sivasagar serving over 5,000 riders with sales, expert service, and genuine accessories.',
  },
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
