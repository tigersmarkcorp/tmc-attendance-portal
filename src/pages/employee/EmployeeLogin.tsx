import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Clock, Loader2, Lock, Mail, UserCircle, Calendar, FileText, Building2, CheckCircle2, BarChart3, Shield, Wallet } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function EmployeeLogin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'employee') {
        navigate('/employee');
      } else if (role === 'admin') {
        toast({
          title: 'Admin Account Detected',
          description: 'Redirecting to admin dashboard.',
        });
        navigate('/admin');
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
    { icon: <Clock       className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(249,115,22,0.75)',  border: 'rgba(249,115,22,0.90)', title: 'Clock In / Out',    desc: 'Selfie-verified time tracking for secure attendance' },
    { icon: <FileText    className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(234,88,12,0.75)',   border: 'rgba(234,88,12,0.90)',  title: 'View Timesheets',   desc: 'Work hours, overtime and earnings history' },
    { icon: <Calendar    className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(251,146,60,0.75)',  border: 'rgba(251,146,60,0.90)', title: 'Leave Requests',    desc: 'Submit and track leave applications easily' },
    { icon: <Wallet      className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(249,115,22,0.65)',  border: 'rgba(249,115,22,0.80)', title: 'Payslip Access',    desc: 'View and download your monthly payslips' },
    { icon: <BarChart3   className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(234,88,12,0.75)',   border: 'rgba(234,88,12,0.90)',  title: 'Attendance Report', desc: 'Personal attendance summary and analytics' },
    { icon: <UserCircle  className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(251,146,60,0.75)',  border: 'rgba(251,146,60,0.90)', title: 'My Profile',        desc: 'Update personal info and preferences' },
  ];

  const tickers = [
    { label: 'Real-Time Clock In/Out',   color: '#f97316' },
    { label: 'Selfie Verification',      color: '#ea580c' },
    { label: 'Leave Management',         color: '#fb923c' },
    { label: 'Timesheet Access',         color: '#fdba74' },
    { label: 'Payslip Downloads',        color: '#f97316' },
    { label: 'Overtime Tracking',        color: '#ea580c' },
    { label: 'Attendance Summary',       color: '#fb923c' },
    { label: 'Personal Document Vault',  color: '#fdba74' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes el-carousel-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes el-ticker-scroll {
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
        .el-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh; width: 100vw;
          display: flex; overflow: hidden;
          position: relative;
          background: #fff7ed;
          isolation: isolate;
        }

        /* ── BG — no background-attachment:fixed ── */
        .el-bg {
          position: fixed; inset: 0; z-index: -3;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=55');
          background-size: cover; background-position: center;
          transform: translateZ(0);
        }
        .el-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(
            160deg,
            rgba(255,252,248,0.97) 0%,
            rgba(255,248,240,0.97) 50%,
            rgba(255,244,232,0.97) 100%
          );
        }

        /* ── GRID ── */
        .el-grid {
          position: fixed; inset: 0; z-index: -2; pointer-events: none;
          background-image:
            linear-gradient(rgba(249,115,22,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.07) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        /* ── ORBS — no filter:blur ── */
        .el-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: -1;
          transform: translateZ(0);
          animation: orb-pulse 11s ease-in-out infinite;
        }
        .el-orb-1 {
          width: 560px; height: 560px; top: -200px; left: -160px;
          background: radial-gradient(circle at center, rgba(249,115,22,0.22), transparent 68%);
        }
        .el-orb-2 {
          width: 440px; height: 440px; bottom: -150px; right: -110px;
          background: radial-gradient(circle at center, rgba(251,146,60,0.18), transparent 68%);
          animation-delay: -5.5s;
        }
        .el-orb-3 {
          width: 340px; height: 340px; top: 40%; right: 20%;
          background: radial-gradient(circle at center, rgba(253,186,116,0.14), transparent 68%);
          animation-delay: -3s;
        }

        /* ── LEFT PANEL ── */
        .el-left {
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
        @media (min-width: 1024px) { .el-left { display: flex; } }

        /* ── Brand ── */
        .el-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .el-brand-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(249,115,22,0.60); border: 1px solid rgba(249,115,22,0.80);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px rgba(249,115,22,0.25);
        }
        .el-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #111111; }
        .el-brand-sub  { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: #f97316; margin-top: 2px; }

        /* ── Headline ── */
        .el-headline { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #111111; line-height: 1.22; margin-bottom: 8px; }
        .el-headline span {
          background: linear-gradient(90deg, #f97316, #ea580c, #fb923c);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .el-desc { font-size: 13px; font-weight: 400; color: #222222; line-height: 1.65; margin-bottom: 24px; }

        /* ── Carousel ── */
        .el-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 22px; }
        .el-carousel-track {
          display: flex; gap: 13px;
          animation: el-carousel-slide 18s linear infinite;
          width: max-content;
        }
        .el-carousel:hover .el-carousel-track { animation-play-state: paused; }
        .el-carousel::before, .el-carousel::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 55px; z-index: 2; pointer-events: none;
        }
        .el-carousel::before { left: 0;  background: linear-gradient(to right, rgba(255,252,248,0.95), transparent); }
        .el-carousel::after  { right: 0; background: linear-gradient(to left,  rgba(255,252,248,0.95), transparent); }

        .el-slide {
          flex-shrink: 0; width: 192px;
          padding: 15px; border-radius: 13px;
          background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.55);
          display: flex; flex-direction: column; gap: 9px;
          box-shadow: 0 2px 12px rgba(249,115,22,0.12);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .el-slide:hover { border-color: rgba(249,115,22,0.80); background: rgba(255,255,255,0.98); box-shadow: 0 4px 20px rgba(249,115,22,0.22); }
        .el-slide-icon  { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .el-slide-title { font-size: 12.5px; font-weight: 600; color: #111111; }
        .el-slide-desc  { font-size: 11px; color: #333333; line-height: 1.45; }

        /* ── Stats ── */
        .el-stats { display: flex; gap: 10px; margin-bottom: 20px; }
        .el-stat {
          flex: 1; padding: 11px 12px; border-radius: 11px; text-align: center;
          background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.55);
          box-shadow: 0 2px 12px rgba(249,115,22,0.12);
        }
        .el-stat-num   { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700; line-height: 1; }
        .el-stat-label { font-size: 9.5px; color: #222222; margin-top: 4px; letter-spacing: 0.07em; text-transform: uppercase; }

        /* ── Ticker ── */
        .el-ticker {
          overflow: hidden; padding: 8px 0; margin-bottom: 18px;
          border-top: 1px solid rgba(249,115,22,0.55); border-bottom: 1px solid rgba(249,115,22,0.55);
          position: relative;
        }
        .el-ticker::before, .el-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 36px; z-index: 2; pointer-events: none;
        }
        .el-ticker::before { left: 0;  background: linear-gradient(to right, rgba(255,252,248,0.95), transparent); }
        .el-ticker::after  { right: 0; background: linear-gradient(to left,  rgba(255,252,248,0.95), transparent); }
        .el-ticker-track {
          display: flex;
          animation: el-ticker-scroll 22s linear infinite;
          width: max-content;
        }
        .el-ticker:hover .el-ticker-track { animation-play-state: paused; }
        .el-ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 18px; font-size: 11px; font-weight: 500;
          color: #222222; white-space: nowrap;
        }
        .el-ticker-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── Info note ── */
        .el-note {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px;
          border-radius: 11px;
          background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.35);
        }
        .el-note-title { font-size: 12px; font-weight: 700; color: #ea580c; margin-bottom: 3px; }
        .el-note-desc  { font-size: 11px; color: #222222; line-height: 1.5; }

        /* ── Left Footer ── */
        .el-footer {
          display: flex; align-items: center; gap: 7px;
          padding-top: 16px; margin-top: 16px;
          border-top: 1px solid rgba(249,115,22,0.40);
          font-size: 11px; color: #222222;
        }

        /* ── RIGHT PANEL ── */
        .el-right {
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

        .el-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; justify-content: center;
        }
        @media (min-width: 1024px) { .el-mobile-brand { display: none; } }

        .el-form-header { text-align: center; margin-bottom: 26px; }
        .el-icon-wrap {
          width: 62px; height: 62px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(249,115,22,0.14), rgba(234,88,12,0.08));
          border: 1px solid rgba(249,115,22,0.28);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 4px 24px rgba(249,115,22,0.18);
        }

        .el-title    { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #111111; margin-bottom: 5px; }
        .el-subtitle { font-size: 13px; color: #333333; font-weight: 400; }

        .el-field { margin-bottom: 14px; }
        .el-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: #111111; margin-bottom: 6px;
        }
        .el-input-wrap { position: relative; }
        .el-input-wrap svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; color: rgba(249,115,22,0.55); pointer-events: none;
        }
        .el-input {
          width: 100%; height: 46px; padding: 0 14px 0 38px;
          background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.35);
          border-radius: 10px; color: #111111; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(249,115,22,0.07);
        }
        .el-input::placeholder { color: rgba(0,0,0,0.35); }
        .el-input:focus {
          background: #fff; border-color: rgba(249,115,22,0.60);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }

        /* CTA button */
        .el-btn {
          width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 18px; transition: box-shadow 0.25s ease, transform 0.2s ease;
          box-shadow: 0 6px 26px rgba(249,115,22,0.35);
          position: relative; overflow: hidden;
          transform: translateZ(0);
        }
        .el-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.16), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .el-btn:hover { transform: translateY(-1px) translateZ(0); box-shadow: 0 10px 34px rgba(249,115,22,0.48); }
        .el-btn:hover::after { opacity: 1; }
        .el-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Divider */
        .el-divider { position: relative; margin: 20px 0; text-align: center; }
        .el-divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(249,115,22,0.20);
        }
        .el-divider span {
          position: relative; padding: 0 12px;
          font-size: 10px; color: #444444; text-transform: uppercase; letter-spacing: 0.1em;
          background: rgba(255,255,255,0.88);
        }

        /* Note box */
        .el-note-box {
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(255,255,255,0.80); border: 1px solid rgba(249,115,22,0.25);
          font-size: 12px; color: #222222; text-align: center; line-height: 1.5;
        }

        /* Admin box */
        .el-admin-box {
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(249,115,22,0.06); border: 1px solid rgba(249,115,22,0.22);
          font-size: 12px; text-align: center; line-height: 1.5; color: #222222;
        }
        .el-admin-box span { color: #f97316; font-weight: 600; }
        .el-admin-box a { color: #ea580c; font-weight: 600; text-decoration: none; }
        .el-admin-box a:hover { color: #c2410c; text-decoration: underline; }

        /* Back link */
        .el-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #222222; text-decoration: none;
          padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto;
          border: 1px solid rgba(249,115,22,0.25); background: rgba(249,115,22,0.07);
          transition: all 0.2s ease;
        }
        .el-back:hover { color: #ea580c; background: rgba(249,115,22,0.14); border-color: rgba(249,115,22,0.45); }

        /* Secure badge */
        .el-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content;
          background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.25);
          font-size: 11px; color: #c2410c; font-weight: 700;
        }

        .el-copyright {
          text-align: center; font-size: 11px; color: #888888; margin-top: 14px;
        }
      `}</style>

      <div className="el-root">
        <div className="el-bg" />
        <div className="el-grid" />
        <div className="el-orb el-orb-1" />
        <div className="el-orb el-orb-2" />
        <div className="el-orb el-orb-3" />

        {/* ── LEFT PANEL ── */}
        <div className="el-left">
          <div>
            {/* Brand */}
            <div className="el-brand">
              <div className="el-brand-icon">
                <Clock className="w-5 h-5" style={{ color: '#fff' }} />
              </div>
              <div>
                <div className="el-brand-name">TMC TimeTrack Pro</div>
                <div className="el-brand-sub">Employee Self-Service Portal</div>
              </div>
            </div>

            <h2 className="el-headline">Your Personal <span>Workspace</span><br />& Time Management</h2>
            <p className="el-desc">
              Manage your time, view schedules, submit leave requests, and access your payslips all in one place.
            </p>

            {/* Carousel */}
            <div className="el-carousel">
              <div className="el-carousel-track">
                {[...slides, ...slides].map((s, i) => (
                  <div className="el-slide" key={i}>
                    <div className="el-slide-icon" style={{ background: s.bg, border: `1px solid ${s.border}` }}>{s.icon}</div>
                    <div className="el-slide-title">{s.title}</div>
                    <div className="el-slide-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="el-stats">
              <div className="el-stat">
                <div className="el-stat-num" style={{ color: '#f97316' }}>Live</div>
                <div className="el-stat-label">Attendance</div>
              </div>
              <div className="el-stat">
                <div className="el-stat-num" style={{ color: '#fb923c' }}>24/7</div>
                <div className="el-stat-label">Access</div>
              </div>
              <div className="el-stat">
                <div className="el-stat-num" style={{ color: '#ea580c' }}>L2</div>
                <div className="el-stat-label">Access Level</div>
              </div>
            </div>

            {/* Ticker */}
            <div className="el-ticker">
              <div className="el-ticker-track">
                {[...tickers, ...tickers].map((t, i) => (
                  <span className="el-ticker-item" key={i}>
                    <span className="el-ticker-dot" style={{ background: t.color }}></span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="el-note">
              <UserCircle className="w-4 h-4" style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="el-note-title">Employee Self-Service</div>
                <div className="el-note-desc">Your credentials were provided by your administrator. Contact HR if you have any login issues.</div>
              </div>
            </div>
          </div>

          <div className="el-footer">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#f97316', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="el-right">
          {/* Mobile brand */}
          <div className="el-mobile-brand">
            <div className="el-brand-icon">
              <Clock className="w-5 h-5" style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="el-brand-name">TimeTrack Pro</div>
              <div className="el-brand-sub">Employee Self-Service Portal</div>
            </div>
          </div>

          {/* Header */}
          <div className="el-form-header">
            <div className="el-icon-wrap">
              <UserCircle className="w-7 h-7" style={{ color: '#f97316' }} />
            </div>
            <h1 className="el-title">Employee Login</h1>
            <p className="el-subtitle">Sign in with your company credentials</p>
          </div>

          {/* Form — all logic untouched */}
          <form onSubmit={handleLogin}>
            <div className="el-field">
              <label className="el-label" htmlFor="email">Email Address</label>
              <div className="el-input-wrap">
                <Mail />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="el-input"
                />
              </div>
            </div>

            <div className="el-field">
              <label className="el-label" htmlFor="password">Password</label>
              <div className="el-input-wrap">
                <Lock />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="el-input"
                />
              </div>
            </div>

            <button type="submit" className="el-btn" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><Clock className="w-4 h-4" /> Sign In to Portal</>
              }
            </button>
          </form>

          <div className="el-divider"><span>or</span></div>

          {/* Info */}
          <div className="el-note-box">
            Don't have an account? Your administrator will create one for you.
          </div>

          {/* Admin redirect */}
          <div className="el-admin-box">
            <span>Administrator?</span>{' '}
            <Link to="/admin/login">Go to Admin Login</Link>
          </div>

          <Link to="/" className="el-back">
            <Building2 className="w-3.5 h-3.5" />
            Back to Portal Selection
          </Link>

          <div className="el-secure">
            <CheckCircle2 className="w-3 h-3" style={{ color: '#f97316' }} />
            Secure · Encrypted · Monitored
          </div>

        </div>
      </div>
    </>
  );
}
