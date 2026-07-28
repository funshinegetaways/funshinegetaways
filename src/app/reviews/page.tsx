
'use client';

import { useState, useEffect } from 'react';
import { getFirestore, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import '../globals.css';
import { v4 as uuidv4 } from 'uuid';

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
const auth = getAuth(app);

const ReviewsPage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [newReview, setNewReview] = useState({ name: '', rating: 5, text: '' });
    const [editingReview, setEditingReview] = useState<any | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('reviewToken');
        if (token) {
            setUserToken(token);
        } else {
            const newToken = uuidv4();
            localStorage.setItem('reviewToken', newToken);
            setUserToken(newToken);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/reviews');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setReviews(data.map((r: any) => ({ ...r, timestamp: r.timestamp ? new Date(r.timestamp) : null })));
        } catch (err) {
            console.error('Error fetching reviews', err);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newReview.name || !newReview.text) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            if (editingReview) {
                const reviewRef = doc(db, "reviews", editingReview.id);
                await updateDoc(reviewRef, { ...newReview });
                setEditingReview(null);
                setSuccess('Review updated successfully!');
            } else {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...newReview, userToken }),
                });
                if (!res.ok) throw new Error('Submission failed');
                setSuccess('Your review has been submitted for approval. Thank you!');
            }
            setNewReview({ name: '', rating: 5, text: '' });
            fetchReviews();
        } catch (err) {
            setError('Failed to submit review. Please try again.');
            console.error(err);
        }
    };

    const handleEdit = (review: any) => {
        setEditingReview(review);
        setNewReview({ name: review.name, rating: review.rating, text: review.text });
    };

    const handleDelete = async (reviewId: string) => {
        if (window.confirm("Are you sure you want to delete your review?")) {
            try {
                await deleteDoc(doc(db, "reviews", reviewId));
                fetchReviews();
            } catch (error) {
                console.error("Error deleting review: ", error);
            }
        }
    };

    const canEditOrDelete = (review: any) => {
        if (review.userToken !== userToken) return false;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const reviewTime = review.timestamp instanceof Date
            ? review.timestamp.getTime()
            : review.timestamp?.toDate?.().getTime?.() || 0;
        return reviewTime > 0 && (Date.now() - reviewTime) < sevenDays;
    };

    const approvedReviews = reviews;
    const averageRating = approvedReviews.length
        ? (approvedReviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0) / approvedReviews.length).toFixed(1)
        : '0.0';

    const statStyle = {
        display: 'block',
        fontFamily: 'var(--font-heading)',
        fontSize: '1.7rem',
        color: 'var(--gold)',
        fontWeight: 700
    };

    return (
        <div className="reviews-page-shell" style={{ paddingTop: '110px' }}>
            <div className="reviews-hero glass-card">
                <div className="reviews-hero-copy">
                    <span className="section-tag">Rider Voices</span>
                    <h1>Stories from the road, shared by our riders.</h1>
                    <p>Every review helps future riders discover the thrill of Royal Enfield and the experience at our showroom.</p>
                    <a href="#reviewForm" className="btn-primary">Write a Review</a>
                </div>
                <div className="reviews-hero-stats">
                    <div className="review-stat">
                        <span style={statStyle}>{approvedReviews.length}</span>
                        <span>Approved stories</span>
                    </div>
                    <div className="review-stat">
                        <span style={statStyle}>{averageRating}</span>
                        <span>Average rating</span>
                    </div>
                </div>
            </div>

            <div className="reviews-layout">
                <div className="review-form-container glass-card">
                    <h2 id="reviewForm">{editingReview ? 'Edit Your Review' : 'Leave a Review'}</h2>
                    <p className="review-form-subtitle">Tell us how your experience felt — from the showroom to the ride.</p>
                    <form onSubmit={handleReviewSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Your Name</label>
                            <input type="text" id="name" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Rating</label>
                            <div className="star-rating">
                                {[...Array(5)].map((_, index) => {
                                    const ratingValue = index + 1;
                                    return (
                                        <button
                                            type="button"
                                            key={ratingValue}
                                            onClick={() => setNewReview({ ...newReview, rating: ratingValue })}
                                            className="star-button"
                                            aria-label={`Rate ${ratingValue} out of 5 stars`}
                                        >
                                            ★
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="reviewText">Your Review</label>
                            <textarea id="reviewText" value={newReview.text} onChange={(e) => setNewReview({...newReview, text: e.target.value})} required></textarea>
                        </div>
                        <div className="review-form-actions">
                            <button type="submit" className="btn-primary">{editingReview ? 'Update Review' : 'Submit Review'}</button>
                            {editingReview && <button onClick={() => { setEditingReview(null); setNewReview({ name: '', rating: 5, text: '' }); }} className="btn-outline">Cancel</button>}
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        {success && <p className="success-message">{success}</p>}
                    </form>
                </div>

                <div className="reviews-list">
                    <div className="reviews-list-header">
                        <h3>Recent rider stories</h3>
                        <p>Approved reviews appear here for everyone to see.</p>
                    </div>
                    {approvedReviews.length > 0 ? approvedReviews.map(review => (
                        <div key={review.id} className="review-card glass-card">
                            <div className="review-card-header">
                                <div className="review-card-author">
                                    <div className="testimonial-avatar">{(review.name || '').substring(0,2).toUpperCase()}</div>
                                    <div>
                                        <span style={{ fontWeight: 'bold' }}>{review.name}</span>
                                        <div className="review-card-meta">
                                            <div className="star-rating" aria-hidden="true">{[...Array(5)].map((_, i) => (<span key={i} style={{color: i < (review.rating || 0) ? 'var(--gold)' : '#e6e6e6'}}>★</span>))}</div>
                                            {review.featured && <span className="status-badge status-featured">Featured</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="review-card-date">
                                    <small>{review.timestamp ? new Date(review.timestamp instanceof Date ? review.timestamp : review.timestamp.toDate ? review.timestamp.toDate() : review.timestamp).toLocaleDateString() : ''}</small>
                                </div>
                            </div>
                            <p className="review-card-body">{review.text}</p>
                            <div className="review-card-footer">
                                {canEditOrDelete(review) && (
                                    <div>
                                        <button onClick={() => handleEdit(review)} className="btn-outline review-action-btn">Edit</button>
                                        <button onClick={() => handleDelete(review.id)} className="btn-delete review-action-btn">Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="review-empty glass-card">
                            <h4>No approved reviews yet</h4>
                            <p>Be the first to share your experience and help others discover us.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;
