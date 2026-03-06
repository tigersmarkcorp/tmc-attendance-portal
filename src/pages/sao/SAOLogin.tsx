import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Clock, Loader2, Lock, Mail, MapPin, Calendar, FileText, Building2, ShieldCheck, CheckCircle2, AlertCircle, Users, BarChart3 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function SAOLogin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'site_admin_officer') {
        navigate('/sao');
      } else if (role === 'admin') {
        toast({
          title: 'Admin Account Detected',
          description: 'Redirecting to admin dashboard.',
        });
        navigate('/admin');
      } else if (role === 'employee') {
        toast({
          title: 'Employee Account Detected',
          description: 'Redirecting to employee dashboard.',
        });
        navigate('/employee');
      }
    }
  }, [user, role, authLoading, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email: email.trim(), password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please contact your administrator if you need help.' 
          : error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f97316', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: '#c2410c', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>Loading authentication...</p>
        </div>
      </div>
    );
  }

  const slides = [
    { icon: <Clock      className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(249,115,22,0.75)',  border: 'rgba(249,115,22,0.90)', title: 'Clock In / Out',    desc: 'Selfie-verified time tracking for secure attendance' },
    { icon: <MapPin     className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(234,88,12,0.75)',   border: 'rgba(234,88,12,0.90)',  title: 'Site Management',  desc: 'Oversee operations and attendance compliance' },
    { icon: <FileText   className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(251,146,60,0.75)',  border: 'rgba(251,146,60,0.90)', title: 'Timesheets',       desc: 'Work hours, overtime and earnings history' },
    { icon: <Calendar   className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(249,115,22,0.65)',  border: 'rgba(249,115,22,0.80)', title: 'Leave Requests',   desc: 'Submit and track leave applications easily' },
    { icon: <Users      className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(234,88,12,0.75)',   border: 'rgba(234,88,12,0.90)', title: 'Workforce View',   desc: 'Monitor and coordinate on-site personnel' },
    { icon: <BarChart3  className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(251,146,60,0.75)',  border: 'rgba(251,146,60,0.90)', title: 'Site Analytics',   desc: 'Real-time field operation insights' },
  ];

  const tickers = [
    { label: 'Real-Time Clock In/Out',    color: '#f97316' },
    { label: 'Selfie Verification',       color: '#ea580c' },
    { label: 'Multi-Site Monitoring',     color: '#fb923c' },
    { label: 'Leave Management',          color: '#fdba74' },
    { label: 'Timesheet Access',          color: '#f97316' },
    { label: 'Compliance Auditing',       color: '#ea580c' },
    { label: 'Field Operation Reports',   color: '#fb923c' },
    { label: 'Attendance Sync',           color: '#fdba74' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sl-carousel-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes sl-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1) translateZ(0); }
          50%       { opacity: 0.28; transform: scale(1.06) translateZ(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translate3d(0, 16px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        /* ── ROOT ── */
        .sl-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh; width: 100vw;
          display: flex; overflow: hidden;
          position: relative;
          background: #fff7ed;
          isolation: isolate;
        }

        /* ── BG — no background-attachment:fixed ── */
        .sl-bg {
          position: fixed; inset: 0; z-index: -3;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=55');
          background-size: cover; background-position: center;
          transform: translateZ(0);
        }
        .sl-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(
            160deg,
            rgba(255,252,248,0.97) 0%,
            rgba(255,248,240,0.97) 50%,
            rgba(255,244,232,0.97) 100%
          );
        }

        /* ── GRID ── */
        .sl-grid {
          position: fixed; inset: 0; z-index: -2; pointer-events: none;
          background-image:
            linear-gradient(rgba(249,115,22,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.07) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        /* ── ORBS — no filter:blur ── */
        .sl-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: -1;
          transform: translateZ(0);
          animation: orb-pulse 11s ease-in-out infinite;
        }
        .sl-orb-1 {
          width: 560px; height: 560px; top: -200px; left: -160px;
          background: radial-gradient(circle at center, rgba(249,115,22,0.22), transparent 68%);
        }
        .sl-orb-2 {
          width: 440px; height: 440px; bottom: -150px; right: -110px;
          background: radial-gradient(circle at center, rgba(251,146,60,0.18), transparent 68%);
          animation-delay: -5.5s;
        }

        /* ── LEFT PANEL ── */
        .sl-left {
          position: relative; z-index: 10;
          width: 55%; height: 100vh;
          display: none; flex-direction: column; justify-content: space-between;
          padding: 36px 44px;
          border-right: 1px solid rgba(249,115,22,0.18);
          background: rgba(255,252,248,0.90);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          overflow-y: auto;
          animation: fade-up 0.55s ease both;
        }
        @media (min-width: 1024px) { .sl-left { display: flex; } }

        /* ── Brand ── */
        .sl-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .sl-brand-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(249,115,22,0.60); border: 1px solid rgba(249,115,22,0.80);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px rgba(249,115,22,0.25);
        }
        .sl-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #111111; }
        .sl-brand-sub  { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: #f97316; margin-top: 2px; }

        /* ── Headline ── */
        .sl-headline { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #111111; line-height: 1.22; margin-bottom: 8px; }
        .sl-headline span {
          background: linear-gradient(90deg, #f97316, #ea580c, #fb923c);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sl-desc { font-size: 13px; font-weight: 400; color: #222222; line-height: 1.65; margin-bottom: 24px; }

        /* ── Carousel ── */
        .sl-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 22px; }
        .sl-carousel-track {
          display: flex; gap: 13px;
          animation: sl-carousel-slide 18s linear infinite;
          width: max-content;
        }
        .sl-carousel:hover .sl-carousel-track { animation-play-state: paused; }
        .sl-carousel::before, .sl-carousel::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 55px; z-index: 2; pointer-events: none;
        }
        .sl-carousel::before { left: 0;  background: linear-gradient(to right, rgba(255,252,248,0.95), transparent); }
        .sl-carousel::after  { right: 0; background: linear-gradient(to left,  rgba(255,252,248,0.95), transparent); }

        .sl-slide {
          flex-shrink: 0; width: 192px;
          padding: 15px; border-radius: 13px;
          background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.55);
          display: flex; flex-direction: column; gap: 9px;
          box-shadow: 0 2px 12px rgba(249,115,22,0.12);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .sl-slide:hover { border-color: rgba(249,115,22,0.80); background: rgba(255,255,255,0.98); box-shadow: 0 4px 20px rgba(249,115,22,0.22); }
        .sl-slide-icon  { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .sl-slide-title { font-size: 12.5px; font-weight: 600; color: #111111; }
        .sl-slide-desc  { font-size: 11px; color: #333333; line-height: 1.45; }

        /* ── Stats ── */
        .sl-stats { display: flex; gap: 10px; margin-bottom: 20px; }
        .sl-stat {
          flex: 1; padding: 11px 12px; border-radius: 11px; text-align: center;
          background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.55);
          box-shadow: 0 2px 12px rgba(249,115,22,0.12);
        }
        .sl-stat-num   { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700; line-height: 1; }
        .sl-stat-label { font-size: 9.5px; color: #222222; margin-top: 4px; letter-spacing: 0.07em; text-transform: uppercase; }

        /* ── Ticker ── */
        .sl-ticker {
          overflow: hidden; padding: 8px 0; margin-bottom: 18px;
          border-top: 1px solid rgba(249,115,22,0.55); border-bottom: 1px solid rgba(249,115,22,0.55);
          position: relative;
        }
        .sl-ticker::before, .sl-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 36px; z-index: 2; pointer-events: none;
        }
        .sl-ticker::before { left: 0;  background: linear-gradient(to right, rgba(255,252,248,0.95), transparent); }
        .sl-ticker::after  { right: 0; background: linear-gradient(to left,  rgba(255,252,248,0.95), transparent); }
        .sl-ticker-track {
          display: flex;
          animation: sl-ticker-scroll 22s linear infinite;
          width: max-content;
        }
        .sl-ticker:hover .sl-ticker-track { animation-play-state: paused; }
        .sl-ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 18px; font-size: 11px; font-weight: 500;
          color: #222222; white-space: nowrap;
        }
        .sl-ticker-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Info note ── */
        .sl-note {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px;
          border-radius: 11px;
          background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.35);
        }
        .sl-note-title { font-size: 12px; font-weight: 700; color: #ea580c; margin-bottom: 3px; }
        .sl-note-desc  { font-size: 11px; color: #222222; line-height: 1.5; }

        /* ── Left Footer ── */
        .sl-footer {
          display: flex; align-items: center; gap: 7px;
          padding-top: 16px; margin-top: 16px;
          border-top: 1px solid rgba(249,115,22,0.40);
          font-size: 11px; color: #222222;
        }

        /* ── RIGHT PANEL ── */
        .sl-right {
          position: relative; z-index: 10;
          flex: 1; height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 36px 40px; overflow-y: auto;
          background: rgba(255,255,255,0.88);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          border-left: 1px solid rgba(249,115,22,0.14);
          animation: fade-up 0.55s 0.08s ease both;
        }

        .sl-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; justify-content: center;
        }
        @media (min-width: 1024px) { .sl-mobile-brand { display: none; } }

        .sl-form-header { text-align: center; margin-bottom: 26px; }
        .sl-icon-wrap {
          width: 62px; height: 62px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(249,115,22,0.14), rgba(234,88,12,0.08));
          border: 1px solid rgba(249,115,22,0.28);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 4px 24px rgba(249,115,22,0.18);
        }

        .sl-title    { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #111111; margin-bottom: 5px; }
        .sl-subtitle { font-size: 13px; color: #333333; font-weight: 400; }

        .sl-field { margin-bottom: 14px; }
        .sl-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: #111111; margin-bottom: 6px;
        }
        .sl-input-wrap { position: relative; }
        .sl-input-wrap svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; color: rgba(249,115,22,0.55); pointer-events: none;
        }
        .sl-input {
          width: 100%; height: 46px; padding: 0 14px 0 38px;
          background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.35);
          border-radius: 10px; color: #111111; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(249,115,22,0.07);
        }
        .sl-input::placeholder { color: rgba(0,0,0,0.35); }
        .sl-input:focus {
          background: #fff; border-color: rgba(249,115,22,0.60);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }

        /* CTA button */
        .sl-btn {
          width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 18px; transition: box-shadow 0.25s ease, transform 0.2s ease;
          box-shadow: 0 6px 26px rgba(249,115,22,0.35);
          position: relative; overflow: hidden;
          transform: translateZ(0);
        }
        .sl-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.16), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .sl-btn:hover { transform: translateY(-1px) translateZ(0); box-shadow: 0 10px 34px rgba(249,115,22,0.48); }
        .sl-btn:hover::after { opacity: 1; }
        .sl-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Divider */
        .sl-divider { position: relative; margin: 20px 0; text-align: center; }
        .sl-divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(249,115,22,0.20);
        }
        .sl-divider span {
          position: relative; padding: 0 12px;
          font-size: 10px; color: #444444; text-transform: uppercase; letter-spacing: 0.1em;
          background: rgba(255,255,255,0.88);
        }

        /* Portal switch links */
        .sl-portals { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .sl-portal-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 10px 12px; border-radius: 9px; text-decoration: none;
          font-size: 12px; font-weight: 600; transition: all 0.2s ease;
          border: 1px solid;
        }
        .sl-portal-admin {
          background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.25); color: #dc2626;
        }
        .sl-portal-admin:hover { background: rgba(239,68,68,0.13); border-color: rgba(239,68,68,0.40); }
        .sl-portal-emp {
          background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.30); color: #ea580c;
        }
        .sl-portal-emp:hover { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.50); }

        /* Note box */
        .sl-note-box {
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(255,255,255,0.80); border: 1px solid rgba(249,115,22,0.25);
          font-size: 12px; color: #222222; text-align: center; line-height: 1.5;
        }

        /* Back link */
        .sl-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #222222; text-decoration: none;
          padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto;
          border: 1px solid rgba(249,115,22,0.25); background: rgba(249,115,22,0.07);
          transition: all 0.2s ease;
        }
        .sl-back:hover { color: #ea580c; background: rgba(249,115,22,0.14); border-color: rgba(249,115,22,0.45); }

        /* Secure badge */
        .sl-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content;
          background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.25);
          font-size: 11px; color: #c2410c; font-weight: 700;
        }
      `}</style>

      <div className="sl-root">
        <div className="sl-bg" />
        <div className="sl-grid" />
        <div className="sl-orb sl-orb-1" />
        <div className="sl-orb sl-orb-2" />

        {/* ── LEFT PANEL ── */}
        <div className="sl-left">
          <div>
            {/* Brand */}
            <div className="sl-brand">
              <div className="sl-brand-icon">
                <ShieldCheck className="w-5 h-5" style={{ color: '#fff' }} />
              </div>
              <div>
                <div className="sl-brand-name">TMC TimeTrack Pro</div>
                <div className="sl-brand-sub">Site Admin Officer Portal</div>
              </div>
            </div>

            <h2 className="sl-headline">Site Operations <span>Command</span><br />& Field Management</h2>
            <p className="sl-desc">
              Manage site operations, track attendance with selfie verification, and oversee daily field activities from one central hub.
            </p>

            {/* Carousel */}
            <div className="sl-carousel">
              <div className="sl-carousel-track">
                {[...slides, ...slides].map((s, i) => (
                  <div className="sl-slide" key={i}>
                    <div className="sl-slide-icon" style={{ background: s.bg, border: `1px solid ${s.border}` }}>{s.icon}</div>
                    <div className="sl-slide-title">{s.title}</div>
                    <div className="sl-slide-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="sl-stats">
              <div className="sl-stat">
                <div className="sl-stat-num" style={{ color: '#f97316' }}>Live</div>
                <div className="sl-stat-label">Site Sync</div>
              </div>
              <div className="sl-stat">
                <div className="sl-stat-num" style={{ color: '#fb923c' }}>GPS</div>
                <div className="sl-stat-label">Verified</div>
              </div>
              <div className="sl-stat">
                <div className="sl-stat-num" style={{ color: '#ea580c' }}>L3</div>
                <div className="sl-stat-label">Access Level</div>
              </div>
            </div>

            {/* Ticker */}
            <div className="sl-ticker">
              <div className="sl-ticker-track">
                {[...tickers, ...tickers].map((t, i) => (
                  <span className="sl-ticker-item" key={i}>
                    <span className="sl-ticker-dot" style={{ background: t.color }}></span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="sl-note">
              <ShieldCheck className="w-4 h-4" style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="sl-note-title">Site Administration Access</div>
                <div className="sl-note-desc">Your credentials were provided by your administrator. Contact HR if you have any login issues.</div>
              </div>
            </div>
          </div>

          <div className="sl-footer">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#f97316', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="sl-right">
          {/* Mobile brand */}
          <div className="sl-mobile-brand">
            <div className="sl-brand-icon">
              <ShieldCheck className="w-5 h-5" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="sl-brand-name">TimeTrack Pro</div>
              <div className="sl-brand-sub">Site Admin Officer Portal</div>
            </div>
          </div>

          {/* Header */}
          <div className="sl-form-header">
            <div className="sl-icon-wrap">
              <ShieldCheck className="w-7 h-7" style={{ color: '#f97316' }} />
            </div>
            <h1 className="sl-title">SAO Login</h1>
            <p className="sl-subtitle">Sign in with your site officer credentials</p>
          </div>

          {/* Form — all logic untouched */}
          <form onSubmit={handleLogin}>
            <div className="sl-field">
              <label className="sl-label" htmlFor="email">Email Address</label>
              <div className="sl-input-wrap">
                <Mail />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="sl-input"
                />
              </div>
            </div>

            <div className="sl-field">
              <label className="sl-label" htmlFor="password">Password</label>
              <div className="sl-input-wrap">
                <Lock />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="sl-input"
                />
              </div>
            </div>

            <button type="submit" className="sl-btn" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><ShieldCheck className="w-4 h-4" /> Sign In to Portal</>
              }
            </button>
          </form>

          <div className="sl-divider"><span>or</span></div>

          {/* Info note */}
          <div className="sl-note-box">
            Don't have an account? Your administrator will create one for you.
          </div>

          {/* Portal switch */}
          <div className="sl-portals">
            <Link to="/admin/login" className="sl-portal-btn sl-portal-admin">
              Admin Login
            </Link>
            <Link to="/employee/login" className="sl-portal-btn sl-portal-emp">
              Employee Login
            </Link>
          </div>

          <Link to="/" className="sl-back">
            <Building2 className="w-3.5 h-3.5" />
            Back to Portal Selection
          </Link>

          <div className="sl-secure">
            <CheckCircle2 className="w-3 h-3" style={{ color: '#f97316' }} />
            Secure · Encrypted · Monitored
          </div>
        </div>
      </div>
    </>
  );
}
