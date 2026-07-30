import type { Metadata } from 'next';
import TestRideClient from './TestRideClient';

export const metadata: Metadata = {
  title: 'Book a Test Ride | Royal Enfield Sivasagar',
  description: 'Experience the thrum of a Royal Enfield engine. Book your personalized test ride slot with Funshine Getaways in Sivasagar today.',
  openGraph: {
    title: 'Book a Test Ride | Royal Enfield Sivasagar',
    description: 'Experience the thrum of a Royal Enfield engine. Book your personalized test ride slot with Funshine Getaways in Sivasagar today.',
  },
  alternates: {
    canonical: '/test-ride',
  },
};

export default function TestRidePage() {
  return <TestRideClient />;
}