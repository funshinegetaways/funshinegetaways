import { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | Funshine Getaways',
  description: 'Terms of service for the Funshine Getaways dealership website.',
};

const sections = [
  {
    title: 'Acceptance of terms',
    body: 'By using this website, you agree to these Terms of Service and any applicable local laws. If you do not agree, please discontinue use of the site.',
  },
  {
    title: 'Website use',
    body: [
      'You may use this website to browse models, learn about services, request test rides, and contact our dealership.',
      'You agree not to misuse the website, attempt unauthorized access, or submit harmful or false information.',
    ],
  },
  {
    title: 'Bookings and enquiries',
    body: 'Any booking, test ride request, or inquiry submitted through the website is subject to confirmation by our team. We reserve the right to decline or reschedule requests at our discretion.',
  },
  {
    title: 'Intellectual property',
    body: 'All website content, branding, images, and design are owned by Funshine Getaways or licensed for use on this site. Reproduction without permission is prohibited.',
  },
  {
    title: 'Limitation of liability',
    body: 'Funshine Getaways will not be liable for any indirect, incidental, or consequential damages arising from your use of this website or reliance on its information.',
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These Terms of Service outline the rules and responsibilities for using the Funshine Getaways website and its services."
      sections={sections}
      lastUpdated="28 July 2026"
    />
  );
}
