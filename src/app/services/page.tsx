import type { Metadata } from 'next';
import ServicesClient from './ServicesClient';

export const metadata: Metadata = {
  title: 'Service & Maintenance | Royal Enfield Sivasagar',
  description: 'Authorised Royal Enfield service workshop in Sivasagar. Certified technicians, 100% genuine OEM spare parts, AMC plans, and 24x7 roadside assistance.',
  openGraph: {
    title: 'Service & Maintenance | Royal Enfield Sivasagar',
    description: 'Authorised Royal Enfield workshop with certified technicians, genuine spare parts, and 24x7 roadside assistance.',
  },
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
