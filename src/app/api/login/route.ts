
import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from '@/lib/firebase-admin';
import { rateLimiter, applyLoginDelay, getIp } from '@/lib/security/rate-limiter';
import { logLoginAttempt } from '@/lib/security/auth-logger';
import { isAdminUser } from '@/lib/security/admin-auth';

export const runtime = 'nodejs';

async function createUserProfileIfNotExists(uid: string, email: string | undefined) {
    if (!email) return;
    const userRef = db.collection('users').doc(uid);

    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                email,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                roles: [],
                isAdmin: true,
            });
            console.log(`[login] Created Firestore profile for ${email}`);
        } else {
            // Ensure existing doc has isAdmin flag in sync
            await userRef.update({ isAdmin: true });
        }
    } catch (error) {
        // Non-fatal — log but don't block login
        console.error('[login] Error creating/updating Firestore user profile:', error);
    }
}

export async function POST(req: NextRequest) {
    const ip = getIp(req);

    try {
        await applyLoginDelay(ip);
        const { success: rateLimitSuccess } = await rateLimiter.limit(ip);

        if (!rateLimitSuccess) {
            await logLoginAttempt(req, { success: false, error: 'Rate limit exceeded' });
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const idToken = body.idToken;

        if (!idToken || typeof idToken !== 'string') {
            return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
        }

        // Verify the Firebase ID token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (verifyError: any) {
            console.error('[login] verifyIdToken failed:', verifyError?.message);
            await logLoginAttempt(req, { success: false, error: 'Token verification failed' });
            return NextResponse.json(
                { error: 'Authentication failed. Please sign in again.' },
                { status: 401 }
            );
        }

        const { uid, email } = decodedToken;
        console.log(`[login] Token verified for uid=${uid} email=${email}`);

        // Check admin privileges
        const isAdmin = await isAdminUser(decodedToken);
        if (!isAdmin) {
            await logLoginAttempt(req, { success: false, error: 'User is not an admin' });
            return NextResponse.json(
                { error: 'Access denied. You are not an authorized administrator.' },
                { status: 403 }
            );
        }

        // Create Firestore user profile (non-blocking)
        await createUserProfileIfNotExists(uid, email);

        // Create a session cookie (5 days)
        const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days in ms (for Firebase)
        const SESSION_DURATION_S  = 60 * 60 * 24 * 5;         // 5 days in seconds (for cookie maxAge)

        let sessionCookie: string;
        try {
            sessionCookie = await admin.auth().createSessionCookie(idToken, {
                expiresIn: SESSION_DURATION_MS,
            });
        } catch (cookieError: any) {
            console.error('[login] createSessionCookie failed:', cookieError?.message);
            await logLoginAttempt(req, { success: false, error: `Session creation failed: ${cookieError?.message}` });
            return NextResponse.json(
                { error: 'Failed to create session. Please try again.' },
                { status: 500 }
            );
        }

        await logLoginAttempt(req, { success: true });
        console.log(`[login] Session created for ${email}`);

        const response = NextResponse.json({ success: true, isAdmin: true });
        response.cookies.set('admin-session', sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_DURATION_S, // ← seconds (was erroneously set to ms before)
        });

        return response;

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[login] Unexpected error:', errorMessage);
        await logLoginAttempt(req, { success: false, error: errorMessage });
        return NextResponse.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}
