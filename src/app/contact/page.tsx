import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us & Showroom Location | Royal Enfield Sivasagar',
  description: 'Get in touch with Funshine Getaways in Sivasagar, Assam. Visit our showroom at AT Rd near ASTC Bus Stand, call us at +91 86387 07085, or send an enquiry.',
  openGraph: {
    title: 'Contact Us & Showroom Location | Royal Enfield Sivasagar',
    description: 'Visit our Royal Enfield showroom at AT Rd near ASTC Bus Stand, Sivasagar, Assam. Call +91 86387 07085 or send an online enquiry.',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
