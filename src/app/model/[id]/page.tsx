import type { Metadata } from 'next';
import ModelDetailClient from './ModelDetailClient';
import { db } from '@/lib/firebase-admin';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const docSnap = await db.collection('products').doc(id).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const name = data?.name || 'Motorcycle Model';
      const engine = data?.engine || 'Royal Enfield Motorcycle';
      const price = data?.price ? ` starting at ₹${data.price.toLocaleString('en-IN')}` : '';

      return {
        title: `${name} - Specs, Price & Features`,
        description: `Explore the ${name}${price} at Funshine Getaways in Sivasagar. ${engine}. Book a test ride today.`,
        openGraph: {
          title: `${name} | Royal Enfield Sivasagar`,
          description: `Explore ${name}${price}. Specifications, colors, pricing & test ride details.`,
          images: data?.imageUrl ? [{ url: data.imageUrl, alt: name }] : [],
        },
        alternates: {
          canonical: `/model/${id}`,
        },
      };
    }
  } catch (err) {
    console.error('Error generating model metadata:', err);
  }

  return {
    title: 'Motorcycle Model Details | Royal Enfield Sivasagar',
    description: 'Explore Royal Enfield motorcycle specifications, price, and features at Funshine Getaways.',
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModelDetailClient id={id} />;
}
