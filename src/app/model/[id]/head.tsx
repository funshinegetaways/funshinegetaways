import { Metadata } from 'next';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { buildUrl } from '@/utils/cloudinary';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const productId = params.id;
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);

  const product = docSnap.exists() ? docSnap.data() : null;
  const name = product?.name || 'Royal Enfield Model';
  const engine = product?.engine || 'Royal Enfield motorcycle';
  const imageUrl = product?.imageUrl ? buildUrl(product.imageUrl) : `${defaultUrl}/assets/images/hunter350.png`;
  const price = product?.price ? `₹${product.price.toLocaleString()} onwards` : 'Discover pricing details.';
  const description = `${name} — ${engine}. Starting at ${price}`;

  return {
    title: `${name} | Funshine Getaways`,
    description,
    openGraph: {
      title: `${name} | Funshine Getaways`,
      description,
      type: 'article',
      url: `${defaultUrl}/model/${productId}`,
      siteName: 'Funshine Getaways',
      images: [
        {
          url: imageUrl,
          alt: name,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | Funshine Getaways`,
      description,
      images: [imageUrl],
    },
  };
}
