
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { rateLimiter } from '@/lib/security/rate-limit';
import { applyLoginDelay } from '@/lib/security/login-delay';
import { logLoginAttempt } from '@/lib/security/auth-logger';
import { isAdminUser } from '@/lib/security/admin-auth';

let failedLoginAttempts = new Map<string, number>();

export async function POST(req: NextRequest) {
    const { idToken } = await req.json();

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

    const { success, limit, remaining, reset } = await rateLimiter.limit(ip);

    if (!success) {
        return new NextResponse('Too many requests', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
                'Retry-After': (reset / 1000).toString(),
            },
        });
    }

    const failedAttempts = failedLoginAttempts.get(ip) || 0;
    await applyLoginDelay(failedAttempts);

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const isAdmin = await isAdminUser(decodedToken);

        if (isAdmin) {
            failedLoginAttempts.delete(ip);
            logLoginAttempt(req, { success: true, error: undefined });

            const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
            const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

            const response = new NextResponse(JSON.stringify({ success: true, isAdmin: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });

            response.cookies.set('admin-session', sessionCookie, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 5,
            });

            return response;
        } else {
          // User is authenticated but not an admin
          logLoginAttempt(req, { success: false, error: 'User is not an admin' });
          return new NextResponse(JSON.stringify({ success: true, isAdmin: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
    } catch (error) {
        failedLoginAttempts.set(ip, (failedLoginAttempts.get(ip) || 0) + 1);
        logLoginAttempt(req, { success: false, error: 'Invalid credentials' });

        // We introduce a random delay to make timing attacks more difficult.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));

        return new NextResponse(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
