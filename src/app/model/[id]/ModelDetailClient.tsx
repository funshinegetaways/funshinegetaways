'use client';

import { useEffect, useState } from 'react';
import '../../globals.css';
import NotFoundPage from '../../not-found';
import { buildUrl } from '../../../utils/cloudinary';
import { getEffectivePrice } from '../../../lib/pricing';
import { ProductData, CampaignData } from '../../../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, query } from "firebase/firestore";

const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export default function ModelDetailClient({ id }: { id: string }) {
    const [product, setProduct] = useState<ProductData | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [shareMessage, setShareMessage] = useState('');

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                setLoading(true);
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProduct({ 
                        id: docSnap.id, 
                        ...data, 
                        price: data.price || 0 
                    } as ProductData);
                } else {
                    setNotFound(true);
                }

                const campaignsQuery = query(collection(db, "campaigns"));
                const campaignsSnapshot = await getDocs(campaignsQuery);
                const campaignsData = campaignsSnapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()) as CampaignData);
                setCampaigns(campaignsData);

                setLoading(false);
            };
            fetchData();
        }
    }, [id]);

    if (loading) {
        return <div className="page-shell loading-container"><div></div><div></div><div></div></div>;
    }

    if (notFound) {
        return <NotFoundPage />;
    }

    if (!product) {
        return null;
    }

    const pricing = getEffectivePrice(product, campaigns);
    const currentPageUrl = typeof window !== 'undefined' ? window.location.href : `${defaultSiteUrl}/model/${product.id}`;

    const handleShare = async () => {
        const shareData = {
            title: product.name,
            text: `${product.name} — starting at ₹${product.price.toLocaleString()} from Funshine Getaways. \n`,
            url: currentPageUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                setShareMessage('Shared successfully!');
            } else {
                await navigator.clipboard.writeText(currentPageUrl);
                setShareMessage('Product link copied to clipboard.');
            }
        } catch (err) {
            console.error('Share failed', err);
            setShareMessage('Unable to share this product right now.');
        }
    };

    return (
        <div id="about" className="page-shell">
            {/* Product JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: product.name,
                        image: buildUrl(product.imageUrl),
                        description: product.engine || `${product.name} Royal Enfield motorcycle`,
                        brand: {
                            '@type': 'Brand',
                            name: 'Royal Enfield'
                        },
                        offers: {
                            '@type': 'Offer',
                            priceCurrency: 'INR',
                            price: pricing.finalPrice,
                            itemCondition: 'https://schema.org/NewCondition',
                            availability: 'https://schema.org/InStock',
                            seller: {
                                '@type': 'AutoDealer',
                                name: 'Funshine Getaways Pvt Ltd'
                            }
                        }
                    })
                }}
            />

           <div className="section-header">
                <h1 className="section-title">{product.name}</h1>
           </div>

            {pricing.offerTitle && (
                <div className="offer-banner">
                    <div className="offer-banner-content">
                        <h3>{pricing.offerTitle}</h3>
                        <p>Save up to {pricing.discountPercentage}% with this limited-time offer!</p>
                    </div>
                    {pricing.countdown && <CountdownTimer endDate={pricing.countdown} />}
                </div>
            )}

          <div className="about-grid" style={{alignItems: 'center'}}>
               <div className="about-image">
                  <img src={buildUrl(product.imageUrl)} alt={product.name} style={{width: '100%', borderRadius: '12px'}} />
              </div>
              <div className="about-content">
                  <span className="section-tag">Model Details</span>
                  <h2 className="section-title" style={{textAlign: 'left'}}>{product.name}</h2>
                  <p>{product.engine}</p>
                    <div className="model-card-specs" style={{borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '24px 0', marginBottom: '32px'}}>
                        {product.specs?.map((spec: any, index: number) => spec.value && spec.label && (
                            <div key={index} className="model-spec">
                                <span className="model-spec-val">{spec.value}</span>
                                <span className="model-spec-label">{spec.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="model-price" style={{marginBottom: '32px'}}>
                         {pricing.finalPrice !== pricing.originalPrice ? (
                            <div>
                                <span className="original-price" style={{textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '12px'}}>₹{pricing.formattedOriginalPrice}</span>
                                <span className="final-price">₹{pricing.formattedFinalPrice} onwards</span>
                            </div>
                        ) : (
                            <div>
                                <span className="final-price">₹{pricing.formattedOriginalPrice} onwards</span>
                            </div>
                        )}
                    </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <a href="/test-ride" className="btn-primary">
                        <i className="fa-regular fa-calendar-check"></i> Book a Test Ride
                    </a>
                    <button type="button" onClick={handleShare} className="btn-secondary" style={{ padding: '10px 18px' }}>
                        <i className="fa-solid fa-share-nodes"></i> Share Model
                    </button>
                  </div>
                  {shareMessage && <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>{shareMessage}</p>}
              </div>
          </div>
        </div>
    );
}

const CountdownTimer = ({ endDate }: { endDate: string }) => {
    const calculateTimeLeft = (): TimeLeft => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents = timeLeft.days !== undefined && timeLeft.hours !== undefined;

    return timerComponents ? (
        <div className="countdown-timer-detail">
            <h4>Offer Ends In</h4>
            <div className="timer-boxes">
                <div className="timer-box"><span>{timeLeft.days}</span><span>Days</span></div>
                <div className="timer-box"><span>{timeLeft.hours}</span><span>Hours</span></div>
                <div className="timer-box"><span>{timeLeft.minutes}</span><span>Minutes</span></div>
                 <div className="timer-box"><span>{timeLeft.seconds}</span><span>Seconds</span></div>
            </div>
        </div>
    ) : null;
};
