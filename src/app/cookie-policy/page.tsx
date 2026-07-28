import { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie Policy | Funshine Getaways',
  description: 'Cookie policy for the Funshine Getaways dealership website.',
};

const sections = [
  {
    title: 'What are cookies?',
    body: 'Cookies are small text files stored on your device to help websites remember your preferences, understand usage patterns, and improve the browsing experience.',
  },
  {
    title: 'Cookies we use',
    body: [
      'Essential cookies to keep the site working properly and maintain basic navigation.',
      'Preference cookies to remember your chosen language, theme, and display preferences.',
      'Analytics cookies to understand which pages are most frequently visited and improve performance.',
    ],
  },
  {
    title: 'Managing cookies',
    body: 'You can disable or delete cookies from your browser settings. Please note that some features of the website may not work properly if cookies are disabled.',
  },
  {
    title: 'Consent',
    body: 'By continuing to use our website, you consent to the use of cookies as described in this policy unless you change your browser settings.',
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="This Cookie Policy explains how Funshine Getaways uses cookies and similar technologies on our website."
      sections={sections}
      lastUpdated="28 July 2026"
    />
  );
}
