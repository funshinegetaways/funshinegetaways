import { NextRequest, NextResponse } from 'next/server';
import { admin, db as adminDb } from '../../../lib/firebase-admin';

const COLLECTION = 'reviews';

function sanitize(text: string) {
  return text.replace(/<[^>]*>?/gm, '').trim();
}

export async function GET() {
  try {
    const snapshot = await adminDb.collection(COLLECTION).where('approved', '==', true).orderBy('timestamp', 'desc').get();
    const reviews = snapshot.docs.map(doc => {
      const data: any = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        rating: data.rating || 0,
        text: data.text || '',
        featured: !!data.featured,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null,
      };
    });
    return NextResponse.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews: ', err);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
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

    // Simple rate limit: prevent same token posting more than once per 30 seconds
    if (userToken) {
      const recentQ = adminDb.collection(COLLECTION).where('userToken', '==', userToken).orderBy('timestamp', 'desc').limit(1);
      const recentSnap = await recentQ.get();
      if (!recentSnap.empty) {
        const last = recentSnap.docs[0].data().timestamp;
        if (last && last.toDate) {
          const lastMs = last.toDate().getTime();
          if (Date.now() - lastMs < 30 * 1000) {
            return NextResponse.json({ error: 'You are submitting too frequently' }, { status: 429 });
          }
        }
      }
    }

    const docRef = await adminDb.collection(COLLECTION).add({
      name,
      text,
      rating,
      approved: false,
      featured: false,
      userToken: userToken || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (err) {
    console.error('Error submitting review: ', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
