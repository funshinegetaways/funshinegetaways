import { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Funshine Getaways',
  description: 'Privacy policy for Funshine Getaways, Royal Enfield dealership website.',
};

const sections = [
  {
    title: 'Information we collect',
    body: [
      'Contact details such as your name, email address, phone number, and city when you submit a test ride request or contact form.',
      'Booking and inquiry information related to model interest, preferred dates, and other details you provide voluntarily.',
      'Technical information such as browser type, device, IP address, and site usage data to improve our website experience.',
    ],
  },
  {
    title: 'How we use your information',
    body: [
      'To respond to your enquiries, test ride requests, service bookings, and finance-related questions.',
      'To provide updates, confirmations, and support for your dealership experience.',
      'To improve website performance, security, and customer experience.',
    ],
  },
  {
    title: 'Sharing of information',
    body: [
      'We do not sell your personal information to third parties.',
      'We may share information with trusted service providers that help us run the website, process messages, or deliver support services.',
      'We may disclose information if required by law or to protect our rights and safety.',
    ],
  },
  {
    title: 'Cookies and analytics',
    body: 'We use cookies and analytics tools to understand website performance, remember your preferences, and improve the overall browsing experience. You can manage cookies through your browser settings.',
  },
  {
    title: 'Your choices',
    body: [
      'You may request access, correction, or deletion of your personal information by contacting us directly.',
      'You may opt out of marketing communications at any time by replying with “unsubscribe” or contacting us.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This Privacy Policy explains how Funshine Getaways collects, uses, and protects your information when you interact with our Royal Enfield showroom website."
      sections={sections}
      lastUpdated="28 July 2026"
    />
  );
}
