
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
    const response = NextResponse.json({ success: true });
    // Clear the httpOnly session cookie server-side
    response.cookies.set('admin-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0, // Expire immediately
    });
    return response;
}
