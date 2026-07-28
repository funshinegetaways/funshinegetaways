'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { buildUrl } from '@/utils/cloudinary';
import { getEffectivePrice } from '@/lib/pricing';
import { ProductData, CampaignData } from '@/types';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
}

const filterOptions = [
    { id: 'all', name: 'All Models', icon: 'fa-solid fa-motorcycle' },
    { id: 'classic', name: 'Classic', icon: 'fa-solid fa-chess-knight' },
    { id: 'hunter', name: 'Hunter', icon: 'fa-solid fa-user-secret' },
    { id: 'bullet', name: 'Bullet', icon: 'fa-solid fa-meteor' },
    { id: 'himalayan', name: 'Himalayan', icon: 'fa-solid fa-mountain' },
    { id: 'scram', name: 'Scram', icon: 'fa-solid fa-bolt' },
    { id: 'meteor', name: 'Meteor', icon: 'fa-solid fa-rocket' },
    { id: 'super-meteor', name: 'Super Meteor', icon: 'fa-solid fa-star' },
    { id: 'continental-gt', name: 'Continental GT', icon: 'fa-solid fa-flag-checkered' },
    { id: 'interceptor', name: 'Interceptor', icon: 'fa-solid fa-fighter-jet' },
];

const ModelsPage = () => {
  const [allModels, setAllModels] = useState<ProductData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [filteredModels, setFilteredModels] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const modelsQuery = query(collection(db, "products"), orderBy("createdAt"));
        const modelsSnapshot = await getDocs(modelsQuery);
        const models = modelsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                price: data.price || 0 // Ensure price is a number
            } as ProductData;
        });
        setAllModels(models);
        setFilteredModels(models);

        const campaignsQuery = query(collection(db, "campaigns"));
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const campaignsData = campaignsSnapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()) as CampaignData);
        setCampaigns(campaignsData);

      } catch (error) {
          console.error("Error fetching data: ", error);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredModels(allModels);
    } else {
      setFilteredModels(allModels.filter(model => model.category === activeFilter));
    }
  }, [activeFilter, allModels]);

  return (
    <div id="models" className="page-shell">
      <div className="section-header">
        <h2 className="section-title">Our Legendary Lineup</h2>
        <p className="section-subtitle">Explore the complete range of Royal Enfield motorcycles. Each machine is a piece of history, built to rule the road.</p>
      </div>

      <div className="filter-bar-container">
        <div className="filter-bar">
          {filterOptions.map(option => (
            <button 
              key={option.id} 
              onClick={() => setActiveFilter(option.id)} 
              className={`filter-btn ${activeFilter === option.id ? 'active' : ''}`}>
              <i className={`${option.icon} filter-btn-icon`}></i>
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </div>

        {loading ? (
             <div className="page-shell loading-container"><div></div><div></div><div></div></div>
        ) : (
            <div className="models-grid">
                {filteredModels.map(model => {
                    const pricing = getEffectivePrice(model, campaigns);
                    return (
                        <Link href={`/model/${model.id}`} key={model.id} className="model-card-link">
                            <div className="model-card">
                                <div className="model-card-img">
                                    <img src={buildUrl(model.imageUrl)} alt={model.name} />
                                    {pricing.offerTitle && (
                                        <div className="model-card-badge" style={{ backgroundColor: pricing.badge?.color || 'var(--gold)' }}>
                                            {pricing.badge?.text || 'Offer'}
                                        </div>
                                    )}
                                </div>
                                <div className="model-card-body">
                                <h3 className="model-card-name">{model.name}</h3>
                                <p className="model-card-engine">{model.engine}</p>
                                
                                <div className="model-card-footer">
                                     <div className="model-price">
                                        {pricing.finalPrice !== pricing.originalPrice ? (
                                            <>
                                                <span className="original-price" style={{textDecoration: 'line-through', fontSize: '0.9rem', color: 'var(--text-muted)'}}>₹{pricing.formattedOriginalPrice}</span>
                                                <span className="final-price" style={{fontSize: '1.2rem'}}>₹{pricing.formattedFinalPrice}</span>
                                            </>
                                        ) : (
                                            <span className="final-price" style={{fontSize: '1.2rem'}}>₹{pricing.formattedOriginalPrice} onwards</span>
                                        )}
                                    </div>
                                    <div className="model-explore-btn">Explore &rarr;</div>
                                </div>
                                </div>
                                {pricing.countdown && <CountdownTimer endDate={pricing.countdown} />}
                            </div>
                        </Link>
                    )
                })}
            </div>
        )}
    </div>
  );
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
    const calculateTimeLeft = (): TimeLeft => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft: TimeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
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

    if (!timeLeft.days && !timeLeft.hours && !timeLeft.minutes) {
        return null;
    }

    return (
        <div className="countdown-timer">
            <i className="fa-regular fa-clock"></i>
            <span>
                {(timeLeft.days || 0) > 0 && <strong>{timeLeft.days}d </strong>}
                {(timeLeft.hours || 0) > 0 && <strong>{timeLeft.hours}h </strong>}
                {(timeLeft.minutes || 0) > 0 && <strong>{timeLeft.minutes}m </strong>}
                left to grab this offer!
            </span>
        </div>
    );
};

export default ModelsPage;
