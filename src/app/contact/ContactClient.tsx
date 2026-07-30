'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import emailjs from '@emailjs/browser';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string;
const EMAILJS_TEMPLATE_ID_MANAGER = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_MANAGER as string;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const getRandomNum = () => Math.floor(Math.random() * 10) + 1;

const ContactForm = () => {
  const searchParams = useSearchParams();
  const inquiryType = searchParams.get('type');
  
  const getInitialFormData = () => {
    if (inquiryType === 'finance') {
      return {
        name: '', 
        email: '', 
        phone: '',
        message: '', 
        inquiryType: 'Finance',
        model: searchParams.get('model') || '',
        price: searchParams.get('price') || '',
        company: searchParams.get('company') || '',
        loanAmount: searchParams.get('loanAmount') || '',
        emi: searchParams.get('emi') || '',
        tenure: searchParams.get('tenure') || '',
      };
    }
    return { name: '', email: '', phone: '', message: '' };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(getRandomNum());
  const [captchaNum2, setCaptchaNum2] = useState(getRandomNum());
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    setFormData(getInitialFormData());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const generateCaptcha = () => {
    setCaptchaNum1(getRandomNum());
    setCaptchaNum2(getRandomNum());
    setCaptchaAnswer('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getManagerEmailBody = (title: string, data: any) => {
    const currentYear = new Date().getFullYear();
    const details = Object.entries(data)
        .map(([key, value]) => {
            if (!value) return '';
            const formattedKey = key.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + key.slice(1);
            return `
                <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; text-transform: capitalize; font-weight: bold; color: #555; width: 30%;">${formattedKey}</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e0e0e0; color: #333;">${value as string}</td>
                </tr>
            `;
        })
        .join('');

    return `
        <!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Teko:wght@400;700&family=Roboto:wght@400;700&display=swap" rel="stylesheet"></head><body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Roboto', sans-serif;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding: 20px 0;"><table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"><tr><td align="center" style="padding: 30px 20px; background-color: #121212;"><h1 style="color: #c9a84c; font-family: 'Teko', sans-serif; font-size: 32px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">${title}</h1></td></tr><tr><td style="padding: 40px 30px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 8px;">${details}</table></td></tr><tr><td style="padding: 20px 30px; background-color: #121212;"><p style="margin: 0; color: #888888; text-align: center; font-size: 12px;">&copy; ${currentYear} Royal Enfield Showroom - Funshine Getaways pvt ltd. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (parseInt(captchaAnswer) !== captchaNum1 + captchaNum2) {
        setFormError('Incorrect CAPTCHA answer. Please try again.');
        generateCaptcha();
        return;
    }

    try {
      const settingDoc = await getDoc(doc(db, 'settings', 'managerDetails'));
      const managerEmailAddress = settingDoc.exists() ? settingDoc.data().email : '';

      await addDoc(collection(db, "messages"), { ...formData, timestamp: serverTimestamp() });

      if (managerEmailAddress) {
        const subject = inquiryType === 'finance' ? `New Finance Inquiry: ${formData.model}` : 'New Message from Website Contact Form';
        const title = inquiryType === 'finance' ? 'New Finance Inquiry' : 'New Contact Message';
        const emailBody = getManagerEmailBody(title, formData);
        const templateParams = { manager_email: managerEmailAddress, from_name: formData.name, reply_to: formData.email, subject, email_body: emailBody };
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_MANAGER, templateParams, EMAILJS_PUBLIC_KEY);
      }

      setFormSuccess(true);
      setFormData(getInitialFormData());
      generateCaptcha();

    } catch (error) {
      console.error("Error submitting message: ", error);
      setFormError("Sorry, something went wrong. Please try again later.");
      generateCaptcha();
    }
  }

  const renderFinanceDetails = () => (
    <div className="finance-summary-card glass-card">
      <h3>Finance Inquiry Details</h3>
      <div className="summary-item"><span>Bike Model:</span><span>{formData.model}</span></div>
      <div className="summary-item"><span>Bike Price:</span><span>₹{Number(formData.price).toLocaleString('en-IN')}</span></div>
      <div className="summary-item"><span>Finance Company:</span><span>{formData.company}</span></div>
      <div className="summary-item"><span>Estimated Loan:</span><span>₹{Number(formData.loanAmount).toLocaleString('en-IN')}</span></div>
      <div className="summary-item"><span>Estimated EMI:</span><span>₹{Number(formData.emi).toLocaleString('en-IN')} / mo for {formData.tenure} months</span></div>
    </div>
  );

  return (
    <div className="page-shell">
        <section id="contact" aria-labelledby="contact-title">
        <div className="section-header">
          <span className="section-tag">Contact Us</span>
          <h2 className="section-title" id="contact-title">Get in Touch</h2>
          <p className="section-subtitle">{inquiryType === 'finance' ? 'Complete the form below to proceed with your finance application.' : 'We\'re here to help. Send us a message and we\'ll get back to you.'}</p>
        </div>
        <div className="contact-layout">
          <div className="contact-info">
             <div className="test-ride-form glass-card" style={{padding: '30px'}}>
                <h3 className="form-title">{inquiryType === 'finance' ? 'Finance Application' : 'Send a Message'}</h3>
                {inquiryType === 'finance' && renderFinanceDetails()}
                <form id="contact-form" noValidate onSubmit={handleSubmit} style={{marginTop: '24px'}}>
                <div className="form-grid">
                    <div className="form-group full">
                    <label htmlFor="c-name">Full Name</label>
                    <input type="text" id="c-name" name="name" placeholder="Your Name" required value={formData.name} onChange={handleInputChange} />
                    </div>
                     <div className="form-group">
                        <label htmlFor="c-email">Email Address</label>
                        <input type="email" id="c-email" name="email" placeholder="your.email@example.com" required value={formData.email} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="c-phone">Phone Number</label>
                        <input type="tel" id="c-phone" name="phone" placeholder="+91 98765 43210" required value={formData.phone || ''} onChange={handleInputChange} />
                    </div>
                    <div className="form-group full">
                    <label htmlFor="c-msg">Your Message (Optional)</label>
                    <textarea id="c-msg" name="message" placeholder="Any additional questions or comments?" value={formData.message} onChange={handleInputChange}></textarea>
                    </div>
                    <div className="form-group full">
                        <label htmlFor="f-captcha">Human Verification: What is {captchaNum1} + {captchaNum2}?</label>
                        <input type="number" id="f-captcha" name="captcha" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required />
                    </div>
                </div>
                <button type="submit" className="form-submit">
                    <i className="fa-solid fa-paper-plane"></i> &nbsp; {inquiryType === 'finance' ? 'Submit Application' : 'Send Message'}
                </button>
                </form>
                {formError && <p style={{ color: 'var(--red)', marginTop: '15px', textAlign: 'center' }}>{formError}</p>}
                <div className="form-success" aria-live="polite" style={{ display: formSuccess ? 'block' : 'none' }}>
                <i className="fa-solid fa-circle-check"></i>
                <h3>{inquiryType === 'finance' ? 'Application Submitted!' : 'Message Sent!'}</h3>
                <p>Thanks for reaching out. Our finance team will contact you shortly to process your application.</p>
                </div>
            </div>
          </div>
          <div className="contact-map">
             <div className="contact-item-group">
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
                        <a href="tel:+918638707085">+91 86387 07085</a>
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
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function ContactClient() {
  return (
    <Suspense fallback={<div className="page-shell loading-container"><div></div><div></div><div></div></div>}>
      <ContactForm />
    </Suspense>
  );
}
