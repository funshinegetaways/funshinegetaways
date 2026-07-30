import type { Metadata } from 'next';
import EventsClient from './EventsClient';

export const metadata: Metadata = {
  title: 'Community Events & Rides | Royal Enfield Sivasagar',
  description: 'Stay updated with upcoming Royal Enfield community rides, motorcycle launch events, and exclusive dealership offers at Funshine Getaways in Sivasagar.',
  openGraph: {
    title: 'Community Events & Rides | Royal Enfield Sivasagar',
    description: 'Upcoming Royal Enfield community rides, launch events, and dealership news in Sivasagar.',
  },
  alternates: {
    canonical: '/events',
  },
};

export default function EventsPage() {
  return <EventsClient />;
}
