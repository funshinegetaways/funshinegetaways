import type { Metadata } from 'next';
import FinanceClient from './FinanceClient';

export const metadata: Metadata = {
  title: 'Bike Finance & EMI Calculator | Royal Enfield Sivasagar',
  description: 'Calculate your Royal Enfield EMI and explore flexible motorcycle loan options with leading finance partners at Funshine Getaways Sivasagar.',
  openGraph: {
    title: 'Bike Finance & EMI Calculator | Royal Enfield Sivasagar',
    description: 'Calculate your Royal Enfield EMI and explore flexible motorcycle loan options with leading finance partners.',
  },
  alternates: {
    canonical: '/finance',
  },
};

export default function FinancePage() {
  return <FinanceClient />;
}
