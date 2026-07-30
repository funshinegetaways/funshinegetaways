
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import './login.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Read error from URL search params (set by middleware)
  useEffect(() => {
    const urlError = searchParams?.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: {
      x: number; y: number; r: number; dx: number; dy: number; alpha: number;
    }[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.isAdmin) {
          router.push('/admin');
        } else {
          setError('Access denied. You are not an authorized administrator.');
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <canvas ref={canvasRef} className="lp-canvas" aria-hidden="true" />

      {/* Background gradient orbs */}
      <div className="lp-orb lp-orb-1" aria-hidden="true" />
      <div className="lp-orb lp-orb-2" aria-hidden="true" />

      <div className="lp-center">
        {/* Brand mark */}
        <div className="lp-brand">
          <div className="lp-brand-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20 4L36 14V26L20 36L4 26V14L20 4Z" stroke="url(#grad)" strokeWidth="1.5" fill="none"/>
              <path d="M20 10L30 16V24L20 30L10 24V16L20 10Z" fill="url(#grad)" opacity="0.3"/>
              <circle cx="20" cy="20" r="4" fill="url(#grad)"/>
              <defs>
                <linearGradient id="grad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D4AF37"/>
                  <stop offset="1" stopColor="#F5D76E"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="lp-brand-name">Funshine Getaways</span>
        </div>

        {/* Card */}
        <div className="lp-card">
          <div className="lp-card-header">
            <h1 className="lp-title">Admin Portal</h1>
            <p className="lp-subtitle">Secure access for authorized personnel only</p>
          </div>

          {error && (
            <div className="lp-error" role="alert" aria-live="polite">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="lp-form" noValidate>
            {/* Email field */}
            <div className={`lp-field ${focusedField === 'email' ? 'lp-field--focused' : ''} ${email ? 'lp-field--filled' : ''}`}>
              <label htmlFor="admin-email" className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"/>
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"/>
                  </svg>
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  className="lp-input"
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password field */}
            <div className={`lp-field ${focusedField === 'password' ? 'lp-field--focused' : ''} ${password ? 'lp-field--filled' : ''}`}>
              <label htmlFor="admin-password" className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/>
                  </svg>
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="lp-input lp-input--password"
                  aria-label="Password"
                />
                <button
                  type="button"
                  className="lp-toggle-pw"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur stealing the event
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd"/>
                      <path d="M10.748 13.93l2.523 2.524a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={isLoading}
              className={`lp-btn ${isLoading ? 'lp-btn--loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="lp-spinner" aria-hidden="true" />
                  Authenticating…
                </>
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="lp-footer">
            <span className="lp-lock-icon" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 1a3.5 3.5 0 00-3.5 3.5V6H4a1 1 0 00-1 1v7a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-.5V4.5A3.5 3.5 0 008 1zm2.5 5V4.5a2.5 2.5 0 10-5 0V6h5z" clipRule="evenodd"/>
              </svg>
            </span>
            Protected by Firebase Auth · Session expires in 5 days
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
