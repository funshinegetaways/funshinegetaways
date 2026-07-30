'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import emailjs from '@emailjs/browser';
import '../globals.css';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string;
const EMAILJS_TEMPLATE_ID_MANAGER = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_MANAGER as string;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string;

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const getRandomNum = () => Math.floor(Math.random() * 10) + 1;

export default function TestRideClient() {
    const [models, setModels] = useState<any[]>([]);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', model: '', date: '', city: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
    const [captchaNum1, setCaptchaNum1] = useState(1);
    const [captchaNum2, setCaptchaNum2] = useState(1);
    const [captchaAnswer, setCaptchaAnswer] = useState('');

    useEffect(() => {
        const fetchModels = async () => {
            const modelsQuery = query(collection(db, "products"), orderBy("name"));
            const modelsSnapshot = await getDocs(modelsQuery);
            setModels(modelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchModels();
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        setCaptchaNum1(getRandomNum());
        setCaptchaNum2(getRandomNum());
        setCaptchaAnswer('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Teko:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet"></head><body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Roboto', sans-serif;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding: 20px 0;"><table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"><tr><td align="center" style="padding: 30px 20px; background-color: #121212;"><h1 style="color: #c9a84c; font-family: 'Teko', sans-serif; font-size: 32px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">${title}</h1></td></tr><tr><td style="padding: 40px 30px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 8px;">${details}</table></td></tr><tr><td style="padding: 20px 30px; background-color: #121212;"><p style="margin: 0; color: #888888; text-align: center; font-size: 12px;">&copy; ${currentYear} Royal Enfield Amguri. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;
  };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus(null);
        setIsSubmitting(true);

        if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
            setSubmitStatus('error');
            setIsSubmitting(false);
            generateCaptcha();
            return;
        }

        try {
            const settingDoc = await getDoc(doc(db, 'settings', 'managerDetails'));
            const managerEmailAddress = settingDoc.exists() ? settingDoc.data().email : '';

            if (!managerEmailAddress) {
                setSubmitStatus('error');
                setIsSubmitting(false);
                return;
            }

            await addDoc(collection(db, "bookings"), { ...formData, timestamp: serverTimestamp(), status: 'Pending' });
            
            const emailBody = getManagerEmailBody('New Test Ride Request', formData);
            const templateParams = { manager_email: managerEmailAddress, from_name: 'Royal Enfield Amguri', reply_to: formData.email, subject: `New Test Ride Request: ${formData.model || 'Test Ride'}`, email_body: emailBody };

            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_MANAGER, templateParams, EMAILJS_PUBLIC_KEY);

            setSubmitStatus('success');
            setFormData({ name: '', phone: '', email: '', model: '', date: '', city: '', message: '' });
            generateCaptcha();

        } catch (error) {
            console.error("Submission failed:", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="test-ride" aria-labelledby="test-ride-title">
            <div className="test-ride-layout">
                <div className="test-ride-info">
                    <span className="section-tag">Experience It</span>
                    <h2 className="section-title" id="test-ride-title">Book a<br />Test Ride</h2>
                    <p>Words can't describe the thrum of a Royal Enfield engine beneath you. Fill in the form and one of our brand specialists will reach out to schedule your personal test ride experience.</p>
                    <div className="test-ride-perks">
                        <div className="perk-item"><i className="fa-solid fa-check"></i> No commitment required</div>
                        <div className="perk-item"><i className="fa-solid fa-check"></i> Personal riding expert assigned</div>
                        <div className="perk-item"><i className="fa-solid fa-check"></i> Rides available 7 days a week</div>
                        <div className="perk-item"><i className="fa-solid fa-check"></i> Full model range available</div>
                    </div>
                </div>
                <div className="test-ride-form glass-card">
                    <h3 className="form-title">Reserve Your Slot</h3>
                     {submitStatus === 'success' ? (
                        <div className="form-success" aria-live="polite">
                            <i className="fa-solid fa-circle-check"></i>
                            <h3>Request Received!</h3>
                            <p>Our team will contact you within 24 hours to confirm your test ride slot. Thank you for choosing Royal Enfield.</p>
                        </div>
                    ) : (
                    <form id="booking-form" noValidate onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="f-name">Full Name</label>
                                <input type="text" id="f-name" name="name" placeholder="Rajiv Mehta" required value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="f-phone">Phone Number</label>
                                <input type="tel" id="f-phone" name="phone" placeholder="+91 98765 43210" required value={formData.phone} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="f-email">Email Address</label>
                                <input type="email" id="f-email" name="email" placeholder="rajiv@mail.com" value={formData.email} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="f-model">Preferred Model</label>
                                <select id="f-model" name="model" required value={formData.model} onChange={handleInputChange}>
                                    <option value="" disabled>Select a model</option>
                                    {models.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="f-date">Preferred Date</label>
                                <input type="date" id="f-date" name="date" value={formData.date} onChange={handleInputChange} />
                            </div>
                             <div className="form-group">
                                <label htmlFor="f-city">Your City</label>
                                <input type="text" id="f-city" name="city" placeholder="Mumbai" value={formData.city} onChange={handleInputChange} />
                            </div>
                             <div className="form-group full">
                                <label htmlFor="f-msg">Message (Optional)</label>
                                <textarea id="f-msg" name="message" placeholder="Any specific queries or requirements..." value={formData.message} onChange={handleInputChange}></textarea>
                            </div>
                            <div className="form-group full">
                                <label htmlFor="f-captcha">Human Verification: What is {captchaNum1} + {captchaNum2}?</label>
                                <input type="number" id="f-captcha" name="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required />
                            </div>
                        </div>
                        <button type="submit" className="form-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : <><i className="fa-solid fa-paper-plane"></i> &nbsp; Submit Request</>}
                        </button>
                         {submitStatus === 'error' && <p style={{ color: 'var(--red)', marginTop: '15px', textAlign: 'center' }}>Incorrect CAPTCHA or server error. Please try again.</p>}
                    </form>
                    )}
                </div>
            </div>
        </section>
    );
}
