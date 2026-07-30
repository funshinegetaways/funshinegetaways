'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { CldImage } from 'next-cloudinary';

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

interface FinanceCompany {
    id: string;
    name: string;
    logo: string;
    description: string;
    interestRate: number;
    allowedTenures: number[];
}

interface BikeModel {
    id: string;
    name: string;
    price: number;
}

interface FinanceSettings {
    defaultDisclaimer: string;
    currencySymbol: string;
}

export default function FinanceClient() {
    const [companies, setCompanies] = useState<FinanceCompany[]>([]);
    const [bikes, setBikes] = useState<BikeModel[]>([]);
    const [settings, setSettings] = useState<FinanceSettings | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<FinanceCompany | null>(null);
    const [selectedBike, setSelectedBike] = useState<BikeModel | null>(null);
    const [downPayment, setDownPayment] = useState(0);
    const [tenure, setTenure] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const companiesQuery = query(collection(db, "finance_companies"), where("isActive", "==", true), orderBy("displayOrder"));
                const companiesSnap = await getDocs(companiesQuery);
                setCompanies(companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinanceCompany)));

                const bikesQuery = query(collection(db, "products"), where("financeEnabled", "==", true));
                const bikesSnap = await getDocs(bikesQuery);
                const bikeData = bikesSnap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        price: data.price || 0
                    };
                });
                setBikes(bikeData as BikeModel[]);

                setSettings({ defaultDisclaimer: 'EMI is estimated and subject to final approval.', currencySymbol: '₹' });

            } catch (error) {
                console.error("Error fetching finance data: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCompanySelect = (company: FinanceCompany) => {
        setSelectedCompany(company);
        if (company.allowedTenures?.length > 0) {
            setTenure(company.allowedTenures[0]);
        } else {
            setTenure(0);
        }
        setSelectedBike(null);
        setDownPayment(0);
    };

    const handleBikeSelect = (bikeId: string) => {
        const bike = bikes.find(b => b.id === bikeId);
        if (bike) {
            setSelectedBike(bike);
            setDownPayment(Math.round(bike.price * 0.1));
        } else {
            setSelectedBike(null);
            setDownPayment(0);
        }
    };

    const loanAmount = selectedBike ? selectedBike.price - downPayment : 0;
    const monthlyInterestRate = selectedCompany ? selectedCompany.interestRate / 12 / 100 : 0;
    const emi = loanAmount > 0 && monthlyInterestRate > 0 && tenure > 0
        ? (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) / (Math.pow(1 + monthlyInterestRate, tenure) - 1)
        : 0;

    if (loading) return <div className="page-shell loading-container"><div></div><div></div><div></div></div>;

    return (
        <div className="page-shell">
            <div className="section-header">
                <h2 className="section-title">Finance Your Ride</h2>
                <p className="section-subtitle">Partnering with trusted companies to make your dream a reality.</p>
            </div>

            {/* Step 1: Finance Partners */}
            <div className="finance-partners">
                <h3 className="subsection-title">1. Select a Finance Partner</h3>
                <div className="company-grid">
                    {companies.map(c => (
                        <div key={c.id} className={`company-card ${selectedCompany?.id === c.id ? 'selected' : ''}`} onClick={() => handleCompanySelect(c)}>
                            <CldImage src={c.logo} alt={c.name} className="company-logo" width="100" height="50" objectFit="contain" />
                            <div className="company-name">{c.name}</div>
                            <div className="company-rate">Starts at {c.interestRate}% p.a.</div>
                            {selectedCompany?.id === c.id && <div className="check-icon"><i className="fa-solid fa-check-circle"></i></div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 2: EMI Calculator */}
            {selectedCompany && (
                <div className="emi-calculator-section">
                     <h3 className="subsection-title">2. Calculate Your EMI</h3>
                    <div className="calculator-grid">
                        {/* Left Side: Inputs */}
                        <div className="calculator-inputs glass-card">
                            <select onChange={(e) => handleBikeSelect(e.target.value)} value={selectedBike?.id || ''} >
                                <option value="" disabled>Select Bike Model</option>
                                {bikes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>

                            {selectedBike && (
                                <>
                                    <div className="input-group">
                                        <label>Bike Price</label>
                                        <span>{settings?.currencySymbol}{selectedBike.price.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="input-group">
                                        <label>Down Payment ({settings?.currencySymbol}{downPayment.toLocaleString('en-IN')})</label>
                                        <input type="range" min={0} max={selectedBike.price * 0.8} value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} />
                                    </div>
                                    <div className="input-group">
                                        <label>Loan Amount</label>
                                        <span className="highlight-text">{settings?.currencySymbol}{loanAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="input-group">
                                        <label>Loan Tenure (Months)</label>
                                        <div className="tenure-options">
                                            {selectedCompany.allowedTenures.map(t => (
                                                <button key={t} className={tenure === t ? 'active' : ''} onClick={() => setTenure(t)}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Side: Summary */}
                        {selectedBike && (
                            <div className="calculator-summary">
                                <div className="emi-display glass-card"> 
                                    <div className="emi-label">Estimated Monthly EMI</div>
                                    <div className="emi-value">{settings?.currencySymbol}{Math.round(emi).toLocaleString('en-IN')} / mo</div>
                                </div>
                                <p className="disclaimer"><i className="fa-solid fa-circle-info"></i> {settings?.defaultDisclaimer}</p>

                                <div className="summary-card glass-card">
                                    <h4>Loan Summary</h4>
                                    <div className="summary-item"><span>Bike Price:</span><span>{settings?.currencySymbol}{selectedBike.price.toLocaleString('en-IN')}</span></div>
                                    <div className="summary-item"><span>Down Payment:</span><span>-{settings?.currencySymbol}{downPayment.toLocaleString('en-IN')}</span></div>
                                    <div className="summary-item"><span>Loan Amount:</span><span>{settings?.currencySymbol}{loanAmount.toLocaleString('en-IN')}</span></div>
                                    <div className="summary-item"><span>Interest Rate:</span><span>{selectedCompany.interestRate}% p.a.</span></div>
                                    <div className="summary-item"><span>Tenure:</span><span>{tenure} months</span></div>
                                </div>

                                <div className="calculator-actions">
                                    <Link href={`/contact?type=finance&model=${encodeURIComponent(selectedBike.name)}&price=${selectedBike.price}&company=${encodeURIComponent(selectedCompany.name)}&loanAmount=${loanAmount}&emi=${Math.round(emi)}&tenure=${tenure}`} className="btn-primary">
                                        <i className="fa-solid fa-file-contract"></i> Apply for Finance
                                    </Link>
                                    <Link href={`/test-ride?model=${encodeURIComponent(selectedBike.name)}`} className="btn-outline">
                                        <i className="fa-solid fa-road"></i> Book Test Ride
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
