import { NextRequest, NextResponse } from 'next/server';
import { admin, db as adminDb } from '../../../../lib/firebase-admin';

const COLLECTION = 'reviews';

async function requireAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) return { ok: false, status: 401, msg: 'Missing auth token' };
  const token = m[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (decoded.admin || decoded.role === 'admin' || decoded['admin'] === true) return { ok: true, decoded };
    return { ok: false, status: 403, msg: 'Not authorized' };
  } catch (err) {
    console.error('Token verify error', err);
    return { ok: false, status: 401, msg: 'Invalid token' };
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.msg || 'Unauthorized' }, { status: auth.status || 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const updates: any = {};
    if (typeof body.approved === 'boolean') updates.approved = body.approved;
    if (typeof body.featured === 'boolean') updates.featured = body.featured;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No updates provided' }, { status: 400 });

    await adminDb.collection(COLLECTION).doc(id).update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error updating review', err);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.msg || 'Unauthorized' }, { status: auth.status || 401 });

  try {
    const { id } = await params;
    await adminDb.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting review', err);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
