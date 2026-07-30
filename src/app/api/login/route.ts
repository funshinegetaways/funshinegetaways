
import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';
import { rateLimiter, applyLoginDelay, getIp } from '@/lib/security/rate-limiter';
import { logLoginAttempt } from '@/lib/security/auth-logger';
import { isAdminUser } from '@/lib/security/admin-auth';

export const runtime = 'nodejs';

async function createUserProfileIfNotExists(uid: string, email: string | undefined) {
    if (!email) return;
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        try {
            await userRef.set({
                email: email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                roles: [],
            });
        } catch (error) {
            console.error('Error creating user profile in Firestore:', error);
        }
    }
}

export async function POST(req: NextRequest) {
    const ip = getIp(req);

    try {
        await applyLoginDelay(ip);
        const { success: rateLimitSuccess } = await rateLimiter.limit(ip);

        if (!rateLimitSuccess) {
            await logLoginAttempt(req, { success: false, error: 'Rate limit exceeded' });
            return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const body = await req.json();
        const idToken = body.idToken;

        if (!idToken || typeof idToken !== 'string') {
            return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        const isAdmin = await isAdminUser(decodedToken);
        if (!isAdmin) {
            await logLoginAttempt(req, { success: false, error: 'User is not an admin' });
            return NextResponse.json({ error: 'Access denied. You are not an administrator.' }, { status: 403 });
        }

        await createUserProfileIfNotExists(uid, email);

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

        await logLoginAttempt(req, { success: true });

        // Create the response and set the cookie on it
        const response = NextResponse.json({ success: true, isAdmin: true });
        response.cookies.set('admin-session', sessionCookie, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            path: '/', 
            maxAge: expiresIn 
        });

        return response;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        await logLoginAttempt(req, { success: false, error: errorMessage });

        if (errorMessage.includes('auth/id-token-expired') || errorMessage.includes('auth/argument-error')) {
             return NextResponse.json({ error: 'Authentication failed. Please log in again.' }, { status: 401 });
        }

        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
