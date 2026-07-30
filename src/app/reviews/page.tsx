import type { Metadata } from 'next';
import ReviewsClient from './ReviewsClient';

export const metadata: Metadata = {
  title: 'Rider Reviews & Customer Ratings | Royal Enfield Sivasagar',
  description: 'Read authentic customer reviews and rider stories about Funshine Getaways, authorised Royal Enfield dealership in Sivasagar.',
  openGraph: {
    title: 'Rider Reviews & Customer Ratings | Royal Enfield Sivasagar',
    description: 'Read authentic customer reviews and rider stories about Funshine Getaways in Sivasagar.',
  },
  alternates: {
    canonical: '/reviews',
  },
};

export default function ReviewsPage() {
  return <ReviewsClient />;
}
