'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { getAuth, signOut } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const hasSession = !!Cookies.get('admin-session');
        setIsAuthenticated(hasSession);
        
        // If not authenticated, redirect to /login
        if (!hasSession) {
            router.push('/login');
        }
    }, [pathname, router]);

    if (isAuthenticated === null) {
        return (
            <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <h1 style={{ color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontSize: '2.5rem', letterSpacing: '0.1em' }}>LOADING...</h1>
            </div>
        );
    }

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Firebase sign out error', error);
        }
        Cookies.remove('admin-session');
        router.push('/login');
    };

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-logo">
                    <span className="logo-brand">Funshine Getaways</span>
                    <span className="logo-sub">Admin Panel</span>
                </div>
                <nav>
                    <ul>
                        <li><Link href="/admin" className={pathname === '/admin' ? 'active' : ''}><i className="fas fa-tachometer-alt"></i> Dashboard</Link></li>
                        <li><Link href="/admin/analytics" className={pathname.startsWith('/admin/analytics') ? 'active' : ''}><i className="fas fa-chart-line"></i> Analytics</Link></li>
                        <li><Link href="/admin/bookings" className={pathname.startsWith('/admin/bookings') ? 'active' : ''}><i className="fas fa-calendar-check"></i> Bookings</Link></li>
                        <li><Link href="/admin/messages" className={pathname.startsWith('/admin/messages') ? 'active' : ''}><i className="fas fa-envelope"></i> Messages</Link></li>
                        <li><Link href="/admin/reviews" className={pathname.startsWith('/admin/reviews') ? 'active' : ''}><i className="fas fa-star"></i> Reviews</Link></li>
                        <li><Link href="/admin/products" className={pathname.startsWith('/admin/products') ? 'active' : ''}><i className="fas fa-motorcycle"></i> Products</Link></li>
                        <li className={pathname.startsWith('/admin/marketing') ? 'active' : ''}>
                            <Link href="/admin/marketing"><i className="fas fa-bullhorn"></i> Marketing</Link>
                            <ul className="submenu">
                                <li><Link href="/admin/marketing" className={pathname === '/admin/marketing' ? 'sub-active' : ''}><i className="fas fa-tags"></i> Discount Campaigns</Link></li>
                            </ul>
                        </li>
                        <li className={pathname.startsWith('/admin/finance') ? 'active' : ''}>
                            <Link href="/admin/finance/companies"><i className="fas fa-hand-holding-usd"></i> Finance</Link>
                            <ul className="submenu">
                                <li><Link href="/admin/finance/companies" className={pathname === '/admin/finance/companies' ? 'sub-active' : ''}><i className="fas fa-building"></i> Finance Companies</Link></li>
                                <li><Link href="/admin/finance/settings" className={pathname === '/admin/finance/settings' ? 'sub-active' : ''}><i className="fas fa-sliders-h"></i> Finance Settings</Link></li>
                            </ul>
                        </li>
                        <li><Link href="/admin/events" className={pathname.startsWith('/admin/events') ? 'active' : ''}><i className="fas fa-calendar-days"></i> Events</Link></li>
                        <li><Link href="/admin/media" className={pathname.startsWith('/admin/media') ? 'active' : ''}><i className="fas fa-photo-video"></i> Media Library</Link></li>
                        <li><Link href="/admin/settings" className={pathname.startsWith('/admin/settings') ? 'active' : ''}><i className="fas fa-cog"></i> Settings</Link></li>
                        <li><Link href="/admin/receipt" className={pathname.startsWith('/admin/receipt') ? 'active' : ''}><i className="fas fa-receipt"></i> Create Receipt</Link></li>
                    </ul>
                </nav>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={handleSignOut} className="btn-outline" style={{ width: '100%' }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Sign Out
                    </button>
                </div>
            </aside>
            <main className="admin-content">
                <div className="admin-page-body">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
