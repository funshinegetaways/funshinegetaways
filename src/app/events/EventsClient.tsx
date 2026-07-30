'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getFirestore, collection, getDocs, query, orderBy, where
} from 'firebase/firestore';
import { buildUrl } from '../../utils/cloudinary';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

type EventFilter = 'all' | 'event' | 'update' | 'offer';

interface EventItem {
    id: string;
    title: string;
    type: 'event' | 'update' | 'offer';
    date: string;
    time?: string;
    description: string;
    imageUrl?: string;
    link?: string;
    featured: boolean;
    published: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    event: { label: 'Event', icon: 'fa-calendar-days', color: 'var(--gold)' },
    update: { label: 'Update', icon: 'fa-bullhorn', color: '#5ac8fa' },
    offer: { label: 'Offer', icon: 'fa-tag', color: '#32d74b' },
};

const FILTERS: { key: EventFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'fa-grip' },
    { key: 'event', label: 'Events', icon: 'fa-calendar-days' },
    { key: 'update', label: 'Updates', icon: 'fa-bullhorn' },
    { key: 'offer', label: 'Offers', icon: 'fa-tag' },
];

const EventCard = ({ ev }: { ev: EventItem }) => {
    const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.event;
    const isPast = ev.date && new Date(ev.date) < new Date(new Date().toDateString());

    const formatDay = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric' });
    };

    const formatMonthYear = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    };

    return (
        <article className={`event-card ${isPast ? 'event-card--past' : ''}`}>
            {ev.imageUrl && (
                <div className="event-card-img">
                    <img src={buildUrl(ev.imageUrl)} alt={ev.title} loading="lazy" />
                    {isPast && <div className="event-card-past-overlay">Past Event</div>}
                </div>
            )}
            <div className="event-card-body">
                <div className="event-card-meta">
                    <span className="event-type-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
                        <i className={`fa-solid ${cfg.icon}`} />
                        &nbsp;{cfg.label}
                    </span>
                    {ev.featured && (
                        <span className="event-featured-badge">
                            <i className="fa-solid fa-star" /> Featured
                        </span>
                    )}
                </div>

                <div className="event-card-content">
                    <div className="event-date-block">
                        <span className="event-date-day">{formatDay(ev.date)}</span>
                        <span className="event-date-month">{formatMonthYear(ev.date)}</span>
                    </div>
                    <div className="event-card-info">
                        <h3 className="event-card-title">{ev.title}</h3>
                        {ev.time && (
                            <p className="event-card-time">
                                <i className="fa-regular fa-clock" /> {ev.time}
                            </p>
                        )}
                        <p className="event-card-desc">{ev.description}</p>
                        {ev.link && (
                            <a
                                href={ev.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="event-card-cta btn-primary"
                            >
                                Learn More <i className="fa-solid fa-arrow-right" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

export default function EventsClient() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<EventFilter>('all');

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'events'),
                    where('published', '==', true),
                    orderBy('date', 'desc')
                );
                const snap = await getDocs(q);
                setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
            } catch (err) {
                console.error('Error fetching events:', err);
                try {
                    const q2 = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
                    const snap2 = await getDocs(q2);
                    setEvents(
                        snap2.docs
                            .map(d => ({ id: d.id, ...d.data() } as EventItem))
                            .filter(e => e.published)
                    );
                } catch (err2) {
                    console.error('Fallback query failed:', err2);
                }
            }
            setLoading(false);
        };
        fetchEvents();
    }, []);

    const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

    const upcoming = filtered.filter(e => !e.date || new Date(e.date) >= new Date(new Date().toDateString()));
    const past = filtered.filter(e => e.date && new Date(e.date) < new Date(new Date().toDateString()));

    return (
        <>
            {/* Page Hero */}
            <div className="events-page-hero">
                <div className="events-page-hero-bg" aria-hidden="true" />
                <div className="events-page-hero-content">
                    <span className="section-tag">What&apos;s On</span>
                    <h1 className="events-page-title">Events &amp; Updates</h1>
                    <p className="events-page-subtitle">
                        Stay in the loop with the latest happenings at Funshine Getaways — from exclusive launch
                        events and rides to special offers and dealership news.
                    </p>
                    <Link href="#events-list" className="btn-primary events-hero-cta">
                        <i className="fa-solid fa-arrow-down" /> See All Events
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="events-page-body" id="events-list">
                {/* Filter Tabs */}
                <div className="events-filter-tabs">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`events-filter-tab ${filter === f.key ? 'active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            <i className={`fa-solid ${f.icon}`} />
                            <span>{f.label}</span>
                            <span className="events-filter-count">
                                {f.key === 'all' ? events.length : events.filter(e => e.type === f.key).length}
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="events-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        <p>Loading events...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="events-empty">
                        <i className="fa-solid fa-calendar-xmark" />
                        <h3>No events found</h3>
                        <p>Check back soon for upcoming events and announcements.</p>
                    </div>
                ) : (
                    <>
                        {/* Upcoming Events */}
                        {upcoming.length > 0 && (
                            <div className="events-group">
                                <h2 className="events-group-title">
                                    <i className="fa-solid fa-calendar-check" />
                                    Upcoming
                                </h2>
                                <div className="events-grid">
                                    {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
                                </div>
                            </div>
                        )}

                        {/* Past Events */}
                        {past.length > 0 && (
                            <div className="events-group">
                                <h2 className="events-group-title events-group-title--past">
                                    <i className="fa-solid fa-clock-rotate-left" />
                                    Past Events
                                </h2>
                                <div className="events-grid">
                                    {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Back to home CTA */}
            <div className="events-page-footer-cta">
                <div className="events-footer-cta-inner">
                    <h3>Ready to Experience the Thrill?</h3>
                    <p>Visit us at Funshine Getaways and book your Royal Enfield test ride today.</p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/test-ride" className="btn-primary">
                            <i className="fa-solid fa-motorcycle" /> Book a Test Ride
                        </Link>
                        <Link href="/contact" className="btn-outline">
                            <i className="fa-solid fa-location-dot" /> Visit Showroom
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
