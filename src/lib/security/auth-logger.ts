
import { NextRequest } from 'next/server';
import { getIp } from './rate-limiter';

interface LogInfo {
    success: boolean;
    error?: string;
}

// This is a simplified, non-blocking logger.
// For production, you might want to send these logs to a service like Datadog, Sentry, or a logging database.
export const logLoginAttempt = (req: NextRequest, info: LogInfo): Promise<void> => {
    const ip = getIp(req);
    const email = req.headers.get('X-User-Email') || 'unknown'; // The email can be added to the header by the main route

    const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.nextUrl.pathname,
        ip: ip,
        email: email, // This will be 'unknown' if not explicitly passed
        success: info.success,
        error: info.error || null,
        userAgent: req.headers.get('user-agent') || 'unknown',
    };

    // In a real-world scenario, you would not log to the console in production.
    // Instead, you'd use a proper logging service.
    console.log('Login Attempt:', JSON.stringify(logData, null, 2));
    return Promise.resolve();
};
