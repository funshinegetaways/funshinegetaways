'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, getDoc, doc } from "firebase/firestore";
import emailjs from '@emailjs/browser';
import ReceiptLookup from './components/ReceiptLookup';
import StatCounter from '@/components/StatCounter';
import { CldImage } from 'next-cloudinary';
import { CampaignData, ProductData } from '@/types';
import { getEffectivePrice } from '@/lib/pricing';

gsap.registerPlugin(ScrollTrigger);

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};


// --- IMPORTANT: ADD YOUR EMAILJS DETAILS HERE ---
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string;
const EMAILJS_TEMPLATE_ID_MANAGER = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_MANAGER as string;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string;

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const getRandomNum = () => Math.floor(Math.random() * 10) + 1;

const PromoBanner = ({ banner, onClose }: { banner: { enabled: boolean, text: string, link: string }, onClose: () => void }) => {
    if (!banner || !banner.enabled) return null;

    return (
        <div className="promo-banner">
            <p>{banner.text}</p>
            {banner.link && <a href={banner.link} className="promo-link">Learn More</a>}
            <button onClick={onClose} className="close-btn">&times;</button>
        </div>
    );
};

const CampaignBanner = ({ campaign }: { campaign: CampaignData }) => {
    if (!campaign) return null;

    return (
        <div className="campaign-banner-home">
            <p>
                <span>🎉</span> {campaign.campaignName} <span>🎉</span>
            </p>
            <p>
                UP TO {campaign.discountValue}% OFF
            </p>
            <Link href="/models" className="btn-primary">Explore Offers</Link>
        </div>
    );
};

export default function Home() {
  const main = useRef(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<CampaignData | null>(null);
  const [financeCompanies, setFinanceCompanies] = useState<any[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [heroImage, setHeroImage] = useState('');
  const [bookingFormData, setBookingFormData] = useState({
    name: '',
    phone: '',
    email: '',
    model: '',
    date: '',
    city: '',
    message: ''
  });
  const [bookingFormSuccess, setBookingFormSuccess] = useState(false);
  const [bookingFormError, setBookingFormError] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(1);
  const [captchaNum2, setCaptchaNum2] = useState(1);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [loanAmount, setLoanAmount] = useState(150000);
  const [loanTenure, setLoanTenure] = useState(36);
  const [interestRate, setInterestRate] = useState(9.0);
  const [emi, setEmi] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [promoBanner, setPromoBanner] = useState({ enabled: false, text: '', link: '' });
  const [showPromoBanner, setShowPromoBanner] = useState(false);


  useEffect(() => {
    const fetchSiteData = async () => {
      const productsQuery = query(collection(db, "products"), orderBy("createdAt"));
      const productsSnapshot = await getDocs(productsQuery);
      setProducts(productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), price: doc.data().price || 0 } as ProductData)));

      const campaignsQuery = query(collection(db, "campaigns"), where("enabled", "==", true));
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const activeCampaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampaignData)).filter(c => {
          const now = new Date();
          const startDate = new Date(c.startDate);
          const endDate = new Date(c.endDate);
          return now >= startDate && now <= endDate;
      });

      if(activeCampaigns.length > 0) {
        // Assuming highest priority is the first one for now.
        setActiveCampaign(activeCampaigns[0]);
      }
      setCampaigns(activeCampaigns);

      const financeCompaniesQuery = query(collection(db, "finance_companies"), where("isActive", "==", true), orderBy("displayOrder"));
      const financeCompaniesSnapshot = await getDocs(financeCompaniesQuery);
      setFinanceCompanies(financeCompaniesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const promoDoc = await getDoc(doc(db, 'settings', 'promoBanner'));
      if (promoDoc.exists()) {
          const bannerData = promoDoc.data();
          if(bannerData.enabled) {
            setPromoBanner(bannerData as any);
            setShowPromoBanner(true);
          }
      }

      const homepageDoc = await getDoc(doc(db, 'settings', 'homepage'));
        if (homepageDoc.exists()) {
            setHeroImage(homepageDoc.data().heroImage || '');
      }

      const featuredReviewsQuery = query(collection(db, "reviews"), where("featured", "==", true), orderBy("timestamp", "desc"));
      const featuredReviewsSnapshot = await getDocs(featuredReviewsQuery);
      setFeaturedReviews(featuredReviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      try {
        const featuredEventsQuery = query(collection(db, "events"), where("featured", "==", true), where("published", "==", true), orderBy("date", "desc"));
        const featuredEventsSnapshot = await getDocs(featuredEventsQuery);
        setFeaturedEvents(featuredEventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {
        // Fallback if composite index not yet created
        const fallbackEventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const fallbackSnap = await getDocs(fallbackEventsQuery);
        setFeaturedEvents(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((e: any) => e.featured && e.published).slice(0, 3));
      }
    };
    fetchSiteData();
  }, []);

  useEffect(() => {
    setCaptchaNum1(getRandomNum());
    setCaptchaNum2(getRandomNum());
  }, []);

  const generateCaptcha = () => {
    setCaptchaNum1(getRandomNum());
    setCaptchaNum2(getRandomNum());
    setCaptchaAnswer('');
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setBookingFormData({
      ...bookingFormData,
      [e.target.name]: e.target.value
    });
  };

 const getManagerEmailBody = (title: string, data: any) => {
    const currentYear = new Date().getFullYear();
    const details = Object.entries(data)
        .map(([key, value]) => {
            if (!value) return '';
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            return `
                <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; text-transform: capitalize; font-weight: bold; color: #555; width: 30%;">${formattedKey}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; color: #333;">${value as string}</td>
                </tr>
            `;
        })
        .join('');

    return `
        <!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Teko:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet"></head><body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Roboto', sans-serif;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding: 20px 0;"><table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"><tr><td align="center" style="padding: 30px 20px; background-color: #121212;"><h1 style="color: #c9a84c; font-family: 'Teko', sans-serif; font-size: 32px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">${title}</h1></td></tr><tr><td style="padding: 40px 30px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 8px;">${details}</table></td></tr><tr><td style="padding: 20px 30px; background-color: #121212;"><p style="margin: 0; color: #888888; text-align: center; font-size: 12px;">&copy; ${new Date().getFullYear()} Royal Enfield Showroom - Funshine Getaways pvt ltd. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;
};

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingFormError('');
    setBookingFormSuccess(false);

    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
        setBookingFormError('Incorrect CAPTCHA answer. Please try again.');
        generateCaptcha();
        return;
    }

    try {
        const settingDoc = await getDoc(doc(db, 'settings', 'managerDetails'));
        const managerEmailAddress = settingDoc.exists() ? settingDoc.data().email : '';

        if (!managerEmailAddress) {
            console.error("Manager email is not set in the database.");
            setBookingFormError("Could not send notification; administrator has not configured a manager email.");
            return;
        }

        await addDoc(collection(db, "bookings"), { ...bookingFormData, timestamp: serverTimestamp() });
        const emailBody = getManagerEmailBody('New Test Ride Request', bookingFormData);
        const templateParams = { manager_email: managerEmailAddress, from_name: 'Funshine Getaways', reply_to: bookingFormData.email, subject: `New Test Ride Request: ${bookingFormData.model || 'Test Ride'}`, email_body: emailBody };

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_MANAGER, templateParams, EMAILJS_PUBLIC_KEY)
        .then((response) => {
            console.log('Manager notification SUCCESS!', response.status, response.text);
        }, (err) => {
            console.log('Manager notification FAILED...', err);
        });

      setBookingFormSuccess(true);
      setBookingFormData({ name: '', phone: '', email: '', model: '', date: '', city: '', message: '' });
      generateCaptcha();

    } catch (error) {
      console.error("Error submitting booking: ", error);
      setBookingFormError("There's something wrong booking the test drive, try again after some time");
      generateCaptcha();
    }
  };

  useEffect(() => {
    if (isMenuOpen || isReceiptModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMenuOpen, isReceiptModalOpen]);

  useEffect(() => {
    const calculateEmi = () => {
      const p = loanAmount;
      const r = interestRate / 12 / 100;
      const n = loanTenure;
      if (p > 0 && r > 0 && n > 0) {
        const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalAmountValue = emiValue * n;
        const totalInterestValue = totalAmountValue - p;
        setEmi(Math.round(emiValue));
        setTotalAmount(Math.round(totalAmountValue));
        setTotalInterest(Math.round(totalInterestValue));
      }
    };
    calculateEmi();
  }, [loanAmount, loanTenure, interestRate]);


  useEffect(() => {
    const ctx = gsap.context(() => {
        gsap.to("#scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { scrub: 0.3, trigger: "body", start: "top top", end: "bottom bottom" } });
        const mm = gsap.matchMedia();
        gsap.set([".hero-content", ".hero-visual", "#hero-bike"], { clearProps: "transform,opacity" });
        gsap.set(".hero-content", { y: 0, opacity: 1, rotateX: 0, rotateY: 0 });
        gsap.set(".hero-visual", { y: 0, scale: 1, rotateX: 0, rotateY: 0, opacity: 1 });
        gsap.set("#hero-bike", { y: 0, x: 0, scale: 1, opacity: 1, rotateY: 0 });

        mm.add("(min-width: 769px)", () => {
            const heroTL = gsap.timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1.1, invalidateOnRefresh: true } });
            heroTL
                .to(".hero-content", { y: -90, opacity: 0.25, rotateX: 12, rotateY: -8, ease: 'power2.out' }, 0)
                .to(".hero-visual", { y: -100, scale: 1.04, rotateX: 12, rotateY: -8, ease: 'power2.out' }, 0)
                .to("#hero-bike", { y: -220, x: 180, scale: 1.16, opacity: 0.55, rotateY: -18, ease: 'power2.out' }, 0)
                .to(".hero-spotlight", { scale: 1.55, opacity: 0, ease: 'power2.out' }, 0)
                .to(".hero-card-left", { x: -40, y: -50, rotate: -14, opacity: 0.8, ease: 'power2.out' }, 0)
                .to(".hero-card-right", { x: 40, y: 60, rotate: 14, opacity: 0.8, ease: 'power2.out' }, 0)
                .to(".hero-stats", { y: 40, opacity: 0.75, ease: 'power2.out' }, 0)
                .to(".hero-scroll-indicator", { opacity: 0, y: 24, ease: 'power2.out' }, 0);

            const introTL = gsap.timeline({ delay: 0.35 });
            introTL
                .from(".hero-badge", { opacity: 0, y: 24, duration: 0.55 })
                .from(".hero-headline", { opacity: 0, y: 18, duration: 0.7 }, "-=0.3")
                .from(".hero-sub", { opacity: 0, y: 18, duration: 0.55 }, "-=0.25")
                .from(".hero-desc", { opacity: 0, y: 18, duration: 0.6 }, "-=0.25")
                .from(".hero-cta", { opacity: 0, y: 18, duration: 0.55 }, "-=0.25")
                .from(".hero-stats", { opacity: 0, y: 20, duration: 0.55 }, "-=0.25")
                .from(".hero-3d-card", { opacity: 0, y: 30, scale: 0.9, duration: 0.7, stagger: 0.15, ease: 'power3.out' }, "-=0.4")
                .from("#hero-bike", { opacity: 0, x: 100, scale: 0.92, duration: 1.1, ease: 'power3.out' }, "<0.2")
                .from(".hero-scroll-indicator", { opacity: 0, y: 20 }, "-0.4");
        });

        mm.add("(max-width: 768px)", () => {
            gsap.from(".hero-badge", { opacity: 0, y: 20, duration: 0.55 });
            gsap.from(".hero-headline", { opacity: 0, y: 20, duration: 0.65, delay: 0.1 });
            gsap.from(".hero-sub", { opacity: 0, y: 20, duration: 0.5, delay: 0.15 });
            gsap.from(".hero-desc", { opacity: 0, y: 20, duration: 0.55, delay: 0.2 });
            gsap.from(".hero-cta", { opacity: 0, y: 20, duration: 0.55, delay: 0.25 });
            gsap.from(".hero-3d-card", { opacity: 0, y: 20, duration: 0.7, delay: 0.3, stagger: 0.12 });
            gsap.from("#hero-bike", { opacity: 0, y: 50, scale: 0.9, duration: 0.95, ease: 'power3.out', delay: 0.25 });
            gsap.from(".hero-stats", { opacity: 0, y: 20, duration: 0.55, delay: 0.35 });
        });
    }, main);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={main}>
      {showPromoBanner && <PromoBanner banner={promoBanner} onClose={() => setShowPromoBanner(false)} />}
      <ReceiptLookup isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} />
      <section id="hero" aria-label="Hero">
        <canvas id="hero-canvas" aria-hidden="true"></canvas>
        <div className="hero-bg-grad" aria-hidden="true"></div>
        <div className="hero-spotlight" aria-hidden="true"></div>
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              Authorized Dealership &nbsp;|&nbsp; Sivasagar
            </div>
            <h1 className="hero-headline">
              Welcome to <span className="gold-text">Funshine Getaways pvt ltd.</span><br />
              Your Adventure Starts Here.
            </h1>
            <p className="hero-sub">Feel the thunder &nbsp;·&nbsp; Own the road</p>
            <p className="hero-desc">
            Step into the world of Royal Enfield at Royal Enfield Showroom - Funshine Getaways pvt ltd, your authorized dealership in Sivasagar. We are more than just a showroom; we are a hub for riders, adventurers, and enthusiasts.
            </p>
            <div className="hero-cta">
              <a href="#models" className="btn-primary">
                <i className="fa-solid fa-motorcycle"></i> Explore Models
              </a>
              <a href="#test-ride" className="btn-outline">
                <i className="fa-regular fa-calendar-check"></i> Book a Test Ride
              </a>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-3d-card hero-card-left">
              <span className="hero-card-label">New Arrival</span>
              <strong>Hunter 350</strong>
              <span>Built for the city</span>
            </div>
            <div className="hero-3d-card hero-card-right">
              <span className="hero-card-label">Launch Offer</span>
              <strong>0% EMI</strong>
              <span>Flexible finance</span>
            </div>
            <div className="hero-bike-wrap">
                {heroImage ? (
                    <CldImage
                        id="hero-bike"
                        src={heroImage}
                        alt="Royal Enfield Motorcycle Showcase"
                        priority
                        width={500}
                        height={500}
                        format="auto"
                        quality="auto"
                    />
                ) : (
                    <img id="hero-bike" src="/assets/images/hunter350.png" alt="Royal Enfield Hunter 350 — hero showcase" loading="eager" />
                )}
              <div className="hero-bike-shadow"></div>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">15+</div>
            <div className="hero-stat-label">Models<br />Available</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">5K+</div>
            <div className="hero-stat-label">Happy<br />Riders</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">18yr</div>
            <div className="hero-stat-label">Authorized<br />Partner</div>
          </div>
        </div>
        <div className="hero-scroll-indicator" aria-hidden="true">
          <span className="scroll-label">Scroll</span>
          <span className="scroll-line"></span>
        </div>
      </section>
      <section id="models" aria-labelledby="models-title">
        <div className="section-header">
          <span className="section-tag">Our Fleet</span>
          <h2 className="section-title" id="models-title">Featured Models</h2>
          <p className="section-subtitle">Each machine handcrafted to inspire — discover the motorcycle that speaks your language.</p>
        </div>
        {activeCampaign && <CampaignBanner campaign={activeCampaign} />}
        <div className="models-grid">
            {products.map(product => {
                const pricing = getEffectivePrice(product, campaigns);
                return (
                 <Link key={product.id} href={`/model/${product.id}`} passHref>
                    <article className="model-card" role="article" id={product.name === 'Hunter 350' ? 'hunter-card' : undefined}>
                    <div className="model-card-img">
                        <CldImage src={product.imageUrl} width="400" height="400" alt={`Royal Enfield ${product.name}`} loading="lazy" format="auto" quality="auto" />
                        {pricing.badge?.text && <span className="model-card-badge" style={{ backgroundColor: pricing.badge?.color || 'var(--gold)' }}>{pricing.badge.text}</span>}
                    </div>
                    <div className="model-card-body">
                        <h3 className="model-card-name">{product.name}</h3>
                        <p className="model-card-engine">{product.engine}</p>
                        {product.specs && (
                            <div className="model-card-specs">
                                {product.specs.map((spec: any, index: number) => spec.value && spec.label && (
                                    <div key={index} className="model-spec">
                                        <span className="model-spec-val">{spec.value}</span>
                                        <span className="model-spec-label">{spec.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="model-card-footer">
                            <div className="model-price">
                                {pricing.finalPrice !== pricing.originalPrice ? (
                                    <>
                                        <span className="original-price" style={{textDecoration: 'line-through', color: 'var(--text-muted)'}}>₹{pricing.formattedOriginalPrice}</span>
                                        <span className="final-price">₹{pricing.formattedFinalPrice}</span>
                                    </>
                                ) : (
                                    <span>₹{pricing.formattedOriginalPrice} onwards</span>
                                )}
                            </div>
                        <button className="model-explore-btn">Explore <i className="fa-solid fa-arrow-right"></i></button>
                        </div>
                    </div>
                    </article>
              </Link>
            ) })}
        </div>
      </section>

      {/* ===== Featured Events Section ===== */}
      {featuredEvents.length > 0 && (
        <section id="events-highlight" aria-labelledby="events-highlight-title">
          <div className="section-header">
            <span className="section-tag">What&apos;s On</span>
            <h2 className="section-title" id="events-highlight-title">Events &amp; Updates</h2>
            <p className="section-subtitle">Latest happenings, offers, and announcements from Funshine Getaways.</p>
          </div>
          <div className="home-events-grid">
            {featuredEvents.slice(0, 3).map((ev: any) => {
              const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
                event: { label: 'Event', icon: 'fa-calendar-days', color: 'var(--gold)' },
                update: { label: 'Update', icon: 'fa-bullhorn', color: '#5ac8fa' },
                offer: { label: 'Offer', icon: 'fa-tag', color: '#32d74b' },
              };
              const cfg = typeConfig[ev.type] || typeConfig.event;
              const formatDate = (dateStr: string) => {
                if (!dateStr) return '';
                return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              };
              return (
                <div key={ev.id} className="home-event-card glass-card">
                  {ev.imageUrl && (
                    <div className="home-event-card-img">
                       <CldImage src={ev.imageUrl} alt={ev.title} loading="lazy" width="400" height="200" style={{objectFit: 'cover'}} format="auto" quality="auto" />
                    </div>
                  )}
                  <div className="home-event-card-body">
                    <div className="home-event-card-meta">
                      <span className="event-type-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
                        <i className={`fa-solid ${cfg.icon}`} />&nbsp;{cfg.label}
                      </span>
                      {ev.date && <span className="home-event-date"><i className="fa-regular fa-calendar" />&nbsp;{formatDate(ev.date)}</span>}
                    </div>
                    <h3 className="home-event-title">{ev.title}</h3>
                    <p className="home-event-desc">{ev.description}</p>
                    {ev.link && (
                      <a href={ev.link} target="_blank" rel="noopener noreferrer" className="home-event-link">
                        Learn More <i className="fa-solid fa-arrow-right" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/events" className="btn-outline">
              <i className="fa-solid fa-calendar-days" /> View All Events &amp; Updates
            </Link>
          </div>
        </section>
      )}

      <section id="about" aria-labelledby="about-title">
        <div className="about-grid">
          <div className="about-image-wrap">
            <span className="about-frame" aria-hidden="true"></span>
            <img className="about-image-main" src="/assets/images/showroom.png" alt="Royal Enfield showroom interior" loading="lazy" />
            <div className="about-image-accent">
              <span className="accent-num">18</span>
              <span className="accent-label">Years of Pure Legacy</span>
            </div>
          </div>
          <div className="about-content">
            <span className="section-tag">Our Story</span>
            <h2 className="section-title" id="about-title">Welcome to Royal Enfield Showroom - Funshine Getaways pvt ltd</h2>
            <p>We are more than a dealership — we are custodians of a century-old legacy. Established in 2005, we
              have grown to become one of the most trusted Royal Enfield authorized dealerships, serving thousands
              of riders across the region.</p>
            <p>Our state-of-the-art showroom spans over 10,000 sq. ft., featuring the complete Royal Enfield lineup
              alongside expert consultation, authentic accessories, and a world-className service centre.</p>
            <p>Every person who walks through our doors is welcomed into the Royal Enfield brotherhood — a community
              bound not by horsepower alone, but by the spirit of adventure.</p>
            <div className="about-stats">
              <div className="about-stat">
                <StatCounter target={5000} suffix="+" />
                <div className="about-stat-label">Happy Riders</div>
              </div>
              <div className="about-stat">
                <StatCounter target={18} suffix=" Yrs" />
                <div className="about-stat-label">In Business</div>
              </div>
              <div className="about-stat">
                <StatCounter target={30} suffix="+" />
                <div className="about-stat-label">Expert Staff</div>
              </div>
            </div>
            <a href="#test-ride" className="btn-primary">
              <i className="fa-solid fa-route"></i> Book Your Ride
            </a>
          </div>
        </div>
      </section>
        <section id="receipt-download" aria-labelledby="receipt-download-title">
            <div className="section-header">
                <span className="section-tag">Post-Purchase</span>
                <h2 className="section-title" id="receipt-download-title">Download Your Invoice</h2>
                <p className="section-subtitle">Lost your receipt? No problem. Enter your details below to instantly download a digital copy of your invoice.</p>
            </div>
            <div className="text-center">
                 <button onClick={() => setReceiptModalOpen(true)} className="btn-primary text-lg"><i className="fa-solid fa-download"></i> Download Your Receipt</button>
            </div>
        </section>
      <section id="services" aria-labelledby="services-title">
        <div className="services-layout">
          <div className="services-image">
            <img src="/assets/images/workshop.png" alt="Royal Enfield authorized service workshop" loading="lazy" />
            <div className="services-image-overlay">
              <h4><i className="fa-solid fa-shield-halved"></i> &nbsp;100% Genuine Parts</h4>
              <p>Only authentic Royal Enfield spare parts and accessories — sourced directly from the factory,
                with full warranty.</p>
            </div>
          </div>
          <div>
            <span className="section-tag">Expert Care</span>
            <h2 className="section-title" id="services-title">Services &amp;<br />Genuine Parts</h2>
            <p className="section-subtitle" style={{textAlign: 'left',maxWidth:'100%',margin:'16px 0 36px'}}>Your Royal
              Enfield deserves nothing but the best. Our certified technicians and authorised service centre keep
              your machine in peak condition.</p>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-wrench"></i></div>
                <h4>Expert Servicing</h4>
                <p>Scheduled maintenance by RE-certified technicians using precision tools and diagnostics.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-gear"></i></div>
                <h4>Genuine Parts</h4>
                <p>OEM spare partswith factory warranty. No counterfeits, no compromises.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-road"></i></div>
                <h4>Roadside Assistance</h4>
                <p>24×7 emergency support wherever the road takes you. One call away.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-file-contract"></i></div>
                <h4>AMC Plans</h4>
                <p>Annual Maintenance Contracts that give you peace of mind and predictable costs.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-shield"></i></div>
                <h4>Insurance Renewal</h4>
                <p>Hassle-free insurance renewal and claim assistance through our in-house desk.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-spray-can-sparkles"></i></div>
                <h4>Custom Accessories</h4>
                <p>Personalise your ride with official Royal Enfield accessories and custom fitment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="test-ride" aria-labelledby="test-ride-title">
        <div className="test-ride-layout">
          <div className="test-ride-info">
            <span className="section-tag">Experience It</span>
            <h2 className="section-title" id="test-ride-title">Book a<br />Test Ride</h2>
            <p>Words can't describe the thrum of a Royal Enfield engine beneath you. Fill in the form and one of our
              brand specialists will reach out to schedule your personal test ride experience.</p>
            <div className="test-ride-perks">
              <div className="perk-item"><i className="fa-solid fa-check"></i> No commitment required</div>
              <div className="perk-item"><i className="fa-solid fa-check"></i> Personal riding expert assigned</div>
              <div className="perk-item"><i className="fa-solid fa-check"></i> Rides available 7 days a week</div>
              <div className="perk-item"><i className="fa-solid fa-check"></i> Full model range available</div>
            </div>
          </div>
          <div className="test-ride-form glass-card">
            <h3 className="form-title">Reserve Your Slot</h3>
            <form id="booking-form" noValidate onSubmit={handleBookingSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="f-name">Full Name</label>
                  <input type="text" id="f-name" name="name" placeholder="Rajiv Mehta" required value={bookingFormData.name} onChange={handleBookingInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="f-phone">Phone Number</label>
                  <input type="tel" id="f-phone" name="phone" placeholder="+91 98765 43210" required value={bookingFormData.phone} onChange={handleBookingInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="f-email">Email Address</label>
                  <input type="email" id="f-email" name="email" placeholder="rajiv@mail.com" value={bookingFormData.email} onChange={handleBookingInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="f-model">Preferred Model</label>
                  <select id="f-model" name="model" required value={bookingFormData.model} onChange={handleBookingInputChange}>
                    <option value="" disabled>Select a model</option>
                    {products.map(p => <option key={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="f-date">Preferred Date</label>
                  <input type="date" id="f-date" name="date" value={bookingFormData.date} onChange={handleBookingInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="f-city">Your City</label>
                  <input type="text" id="f-city" name="city" placeholder="Sivasagar" value={bookingFormData.city} onChange={handleBookingInputChange} />
                </div>
                <div className="form-group full">
                  <label htmlFor="f-msg">Message (Optional)</label>
                  <textarea id="f-msg" name="message" placeholder="Any specific queries or requirements..." value={bookingFormData.message} onChange={handleBookingInputChange}></textarea>
                </div>
                 <div className="form-group full">
                    <label htmlFor="f-captcha">Human Verification: What is {captchaNum1} + {captchaNum2}?</label>
                    <input type="number" id="f-captcha" name="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="form-submit">
                <i className="fa-solid fa-paper-plane"></i> &nbsp; Submit Request
              </button>
            </form>
            {bookingFormError && <p style={{ color: 'var(--red)', marginTop: '15px', textAlign: 'center' }}>{bookingFormError}</p>}
            <div className="form-success" aria-live="polite" style={{ display: bookingFormSuccess ? 'block' : 'none' }}>
              <i className="fa-solid fa-circle-check"></i>
              <h3>Request Received!</h3>
              <p>Our team will contact you within 24 hours to confirm your test ride slot. Thank you for choosing
                Royal Enfield.</p>
            </div>
          </div>
        </div>
      </section>
      <section id="emi" aria-labelledby="emi-title">
    <div className="emi-layout">
        <div className="section-header">
            <span className="section-tag">Easy Finance</span>
            <h2 className="section-title" id="emi-title">Calculate Your EMI</h2>
            <p className="section-subtitle">Custom financing options with competitive interest rates and flexible tenures up to 60 months. Low down payment, fast approval.</p>
        </div>
        <div className="emi-calculator glass-card">
            <div className="emi-sliders">
                <div className="emi-slider-group">
                    <div className="emi-slider-header">
                        <span className="emi-slider-label">Loan Amount</span>
                        <span className="emi-slider-value" id="loan-display">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(loanAmount)}</span>
                    </div>
                    <input type="range" id="loan-amount" min="50000" max="700000" step="5000" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} aria-label="Loan Amount" />
                </div>
                <div className="emi-slider-group">
                    <div className="emi-slider-header">
                        <span className="emi-slider-label">Loan Tenure</span>
                        <span className="emi-slider-value" id="tenure-display">{loanTenure} mo</span>
                    </div>
                    <input type="range" id="loan-tenure" min="12" max="60" step="6" value={loanTenure} onChange={e => setLoanTenure(Number(e.target.value))} aria-label="Loan Tenure" />
                </div>
                <div className="emi-slider-group">
                    <div className="emi-slider-header">
                        <span className="emi-slider-label">Interest Rate (p.a.)</span>
                        <span className="emi-slider-value" id="rate-display">{interestRate.toFixed(1)}%</span>
                    </div>
                    <input type="range" id="loan-rate" min="8.5" max="16" step="0.1" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} aria-label="Interest Rate" />
                </div>
            </div>
            <div className="emi-result">
                <div className="emi-result-label">Monthly EMI</div>
                <div className="emi-result-amount" id="emi-display">₹{new Intl.NumberFormat('en-IN').format(emi)}</div>
                <div className="emi-result-sub">Estimated — subject to credit approval</div>
                <div className="emi-breakdown">
                    <div className="emi-break-item">
                        <div className="emi-break-val" id="total-display">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalAmount / 1000)}K</div>
                        <div className="emi-break-label">Total Amount</div>
                    </div>
                    <div className="emi-break-item">
                        <div className="emi-break-val" id="interest-display">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(totalInterest / 1000)}K</div>
                        <div className="emi-break-label">Interest Payable</div>
                    </div>
                </div>
            </div>
        </div>
        {financeCompanies.length > 0 && (
            <div className="finance-partners-section">
                <h3 className="finance-partners-title">Our Trusted Finance Partners</h3>
                <div className="finance-partners-list">
                    {financeCompanies.map(c => (
                        <div key={c.id} className="partner-logo-card">
                            <CldImage src={c.logo} alt={c.name} width={100} height={100} style={{objectFit: 'contain'}} format="auto" quality="auto" />
                        </div>
                    ))}
                </div>
                 <div style={{textAlign: 'center',marginTop:'36px'}}>
                <Link href="/finance" className="btn-primary">
                    <i className="fa-solid fa-indian-rupee-sign"></i> View All Finance Options
                </Link>
            </div>
            </div>
        )}
    </div>
</section>
      <section id="testimonials" aria-labelledby="testimonials-title">
        <div className="section-header">
          <span className="section-tag">Voices of the Road</span>
          <h2 className="section-title" id="testimonials-title">What Our Riders Say</h2>
          <p className="section-subtitle">Over 5,000 motorcycles delivered. Here's what the brotherhood has to say.</p>
        </div>
        <div className="testimonials-track-wrap">
          <div className="testimonials-track" id="testimonials-track">
          {featuredReviews.length > 0 ? featuredReviews.map(review => (
            <div className="testimonial-card" key={review.id}>
              {review.featured && <div className="testimonial-badge">Featured</div>}
              <div className="testimonial-quote">"</div>
              <div className="testimonial-stars" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{color: i < (review.rating || 0) ? 'var(--gold)' : '#e6e6e6'}}>★</span>
                ))}
              </div>
              <p className="testimonial-text">{review.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" aria-hidden="true">{(review.name || '').substring(0,2).toUpperCase()}</div>
                <div>
                  <div className="testimonial-name">{review.name}</div>
                  {review.timestamp && <small className="testimonial-date">{new Date(review.timestamp?.toDate ? review.timestamp.toDate() : review.timestamp).toLocaleDateString()}</small>}
                </div>
              </div>
            </div>
          )) : <p>No featured reviews yet.</p>}
          </div>
        </div>
        <div className="testimonials-dots">
          {/* Dots can be dynamically generated based on the number of reviews */}
        </div>
        <div style={{textAlign: 'center', marginTop: '18px'}}>
          <Link href="/reviews" className="btn-outline"><i className="fa-regular fa-star"></i> Leave a review</Link>
        </div>
      </section>
      <section id="contact" aria-labelledby="contact-title">
        <div className="section-header">
          <span className="section-tag">Find Us</span>
          <h2 className="section-title" id="contact-title">Visit the Showroom</h2>
          <p className="section-subtitle">Open 7 days a week. Come breathe in the machines.</p>
        </div>
        <div className="contact-layout">
          <div className="contact-info">
            <p>Our showroom is located in the heart of the city, easily accessible and equipped with the complete
              Royal Enfield experience — from models and accessories to finance and servicing.</p>
            <div className="contact-item">
              <div className="contact-icon"><i className="fa-solid fa-location-dot"></i></div>
              <div className="contact-item-body">
                <h4>Showroom Address</h4>
                <p>AT Rd, near ASTC Bus Stand<br />Sivasagar, Assam - 785640</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><i className="fa-solid fa-phone"></i></div>
              <div className="contact-item-body">
                <h4>Sales &amp; Enquiries</h4>
                <a href="tel:+911244567890">+91 124 456 7890</a><br />
                <a href="tel:+919876543210">+91 9876543210</a>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><i className="fa-solid fa-clock"></i></div>
              <div className="contact-item-body">
                <h4>Showroom Hours</h4>
                <p>Mon – Sat: 9:00 AM – 8:00 PM<br />Sunday: 10:00 AM – 6:00 PM</p>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><i className="fa-solid fa-envelope"></i></div>
              <div className="contact-item-body">
                <h4>Email Us</h4>
                <a href="mailto:funshine.reshowroom@gmail.com">funshine.reshowroom@gmail.com</a>
              </div>
            </div>
            <div className="contact-socials">
              <a href="#" className="social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="#" className="social-btn" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="social-btn" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
              <a href="#" className="social-btn" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a>
            </div>
          </div>
          <div className="contact-map">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3555.842580423468!2d94.6239287!3d26.971883999999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374731af46b9901d%3A0xb7f1fff2e5bdc7ed!2sRoyal%20Enfield%20Showroom%20-%20Funshine%20Getaways%20Pvt%20Ltd!5e0!3m2!1sen!2sin!4v1783549863216!5m2!1sen!2sin" 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin">
            </iframe>
            <div className="map-overlay-badge">
              <i className="fa-solid fa-location-dot"></i> Royal Enfield Showroom - Funshine Getaways pvt ltd
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}