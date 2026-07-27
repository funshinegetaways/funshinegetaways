import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

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
const COLLECTION = 'reviews';

function sanitize(text: string) {
  return text.replace(/<[^>]*>?/gm, '').trim();
}

function toIsoString(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

export async function GET() {
  try {
    const reviewsQuery = query(collection(db, COLLECTION), where('approved', '==', true));
    const reviewsSnapshot = await getDocs(reviewsQuery);

    const reviews = reviewsSnapshot.docs
      .map((docSnapshot) => {
        const data: any = docSnapshot.data();
        return {
          id: docSnapshot.id,
          name: data.name || '',
          rating: data.rating || 0,
          text: data.text || '',
          featured: !!data.featured,
          timestamp: toIsoString(data.timestamp),
        };
      })
      .sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });

    return NextResponse.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews: ', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = sanitize(String(body.name || '')).slice(0, 100);
    const text = sanitize(String(body.text || '')).slice(0, 2000);
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const userToken = String(body.userToken || '');

    if (!name || !text) {
      return NextResponse.json({ error: 'Missing name or text' }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
      name,
      text,
      rating,
      approved: false,
      featured: false,
      userToken: userToken || null,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (err) {
    console.error('Error submitting review: ', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
