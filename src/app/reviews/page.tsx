
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
        return (Date.now() - review.timestamp?.toDate().getTime()) < sevenDays;
    }

    return (
        <div className="container" style={{padding: '50px 0'}}>
            <h1 style={{textAlign: 'center', marginBottom: '50px'}}>Customer Reviews</h1>
            <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <a href="#reviewForm" className="btn-primary">Skip to Submit Review</a>
            </div>
            <div className="reviews-layout">
                <div className="review-form-container glass-card" style={{padding: '30px'}}>
                    <h2 id="reviewForm">{editingReview ? 'Edit Your Review' : 'Leave a Review'}</h2>
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
                                            style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', color: ratingValue <= newReview.rating ? 'var(--gold)' : '#ccc', fontSize: '2rem', lineHeight: '1' }}
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
                        <button type="submit" className="btn-primary">{editingReview ? 'Update Review' : 'Submit Review'}</button>
                        {editingReview && <button onClick={() => { setEditingReview(null); setNewReview({ name: '', rating: 5, text: '' }); }} className="btn-outline" style={{marginLeft: '10px'}}>Cancel</button>}
                        {error && <p className="error-message">{error}</p>}
                        {success && <p className="success-message">{success}</p>}
                    </form>
                </div>
                <div className="reviews-list">
                    {reviews.filter(r => r.approved).map(review => (
                        <div key={review.id} className="review-card glass-card" style={{padding: '20px', marginBottom: '20px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                <div style={{display:'flex', gap: '12px', alignItems: 'center'}}>
                                    <div className="testimonial-avatar">{(review.name || '').substring(0,2).toUpperCase()}</div>
                                    <div>
                                        <strong>{review.name}</strong>
                                        <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
                                            <div className="star-rating" aria-hidden="true">{[...Array(5)].map((_, i) => (<span key={i} style={{color: i < (review.rating||0) ? 'var(--gold)' : '#e6e6e6'}}>★</span>))}</div>
                                            {review.featured && <span className="status-badge status-featured">Featured</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <small style={{color: 'var(--text-muted)'}}>{review.timestamp ? new Date(review.timestamp?.toDate ? review.timestamp.toDate() : review.timestamp).toLocaleDateString() : ''}</small>
                                </div>
                            </div>
                            <p style={{marginTop: '12px'}}>{review.text}</p>
                            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '8px'}}>
                                {canEditOrDelete(review) && (
                                    <div>
                                        <button onClick={() => handleEdit(review)} className="btn-outline" style={{marginRight: '10px', padding: '5px 10px', fontSize: '0.8rem'}}>Edit</button>
                                        <button onClick={() => handleDelete(review.id)} className="btn-delete" style={{padding: '5px 10px', fontSize: '0.8rem'}}>Delete</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewsPage;
