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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#93b4ff', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: 'rgba(110,231,183,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Loading authentication...</p>
        </div>
      </div>
    );
  }

  const slides = [
    { icon: <Clock className="w-4 h-4" style={{ color: '#93b4ff' }} />, bg: 'rgba(59,110,248,0.18)', border: 'rgba(59,110,248,0.3)', title: 'Clock In / Out', desc: 'Selfie-verified time tracking for secure attendance' },
    { icon: <MapPin className="w-4 h-4" style={{ color: '#c4b5fd' }} />, bg: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.3)', title: 'Site Management', desc: 'Oversee operations and attendance compliance' },
    { icon: <FileText className="w-4 h-4" style={{ color: '#a5b4fc' }} />, bg: 'rgba(59,110,248,0.15)', border: 'rgba(59,110,248,0.25)', title: 'Timesheets', desc: 'Work hours, overtime and earnings history' },
    { icon: <Calendar className="w-4 h-4" style={{ color: '#93b4ff' }} />, bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.28)', title: 'Leave Requests', desc: 'Submit and track leave applications easily' },
    { icon: <Users className="w-4 h-4" style={{ color: '#93b4ff' }} />, bg: 'rgba(59,110,248,0.18)', border: 'rgba(59,110,248,0.3)', title: 'Workforce View', desc: 'Monitor and coordinate on-site personnel' },
    { icon: <BarChart3 className="w-4 h-4" style={{ color: '#c4b5fd' }} />, bg: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.3)', title: 'Site Analytics', desc: 'Real-time field operation insights' },
  ];

  const tickers = [
    { label: 'Real-Time Clock In/Out', color: '#93b4ff' },
    { label: 'Selfie Verification', color: '#c4b5fd' },
    { label: 'Multi-Site Monitoring', color: '#93b4ff' },
    { label: 'Leave Management', color: '#a5b4fc' },
    { label: 'Timesheet Access', color: '#93b4ff' },
    { label: 'Compliance Auditing', color: '#c4b5fd' },
    { label: 'Field Operation Reports', color: '#93b4ff' },
    { label: 'Attendance Sync', color: '#a5b4fc' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .sl-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh; width: 100vw;
          display: flex; overflow: hidden;
          position: relative; background: #050814;
        }

        .sl-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80');
          background-size: cover; background-position: center;
        }
        .sl-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(4,7,20,0.94) 0%, rgba(8,13,38,0.90) 50%, rgba(12,8,30,0.94) 100%);
        }

        .sl-grid {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .sl-orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 1; filter: blur(100px); opacity: 0.13; }
        .sl-orb-1 { width: 600px; height: 600px; top: -200px; left: -150px; background: radial-gradient(circle, #3b6ef8, transparent); }
        .sl-orb-2 { width: 450px; height: 450px; bottom: -150px; right: -100px; background: radial-gradient(circle, #7c3bf8, transparent); }

        /* ── LEFT ── */
        .sl-left {
          position: relative; z-index: 10;
          width: 55%; height: 100vh;
          display: none; flex-direction: column; justify-content: center;
          padding: 40px 48px;
          border-right: 1px solid rgba(255,255,255,0.07);
          background: linear-gradient(160deg, rgba(59,110,248,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(124,59,248,0.05) 100%);
          backdrop-filter: blur(8px);
          overflow-y: auto; gap: 0;
        }
        @media (min-width: 1024px) { .sl-left { display: flex; } }

        .sl-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .sl-brand-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(59,110,248,0.18); border: 1px solid rgba(59,110,248,0.32);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(59,110,248,0.15);
        }
        .sl-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; }
        .sl-brand-sub  { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-top: 2px; }

        .sl-headline { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #fff; line-height: 1.22; margin-bottom: 8px; }
        .sl-headline span {
          background: linear-gradient(90deg, #93b4ff, #c4b5fd, #6ee7b7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sl-desc { font-size: 13px; font-weight: 300; color: rgba(255,255,255,0.4); line-height: 1.65; margin-bottom: 28px; }

        /* ── Carousel ── */
        .sl-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 24px; }
        .sl-carousel-track {
          display: flex; gap: 14px;
          animation: sl-carousel-slide 18s linear infinite;
          width: max-content;
        }
        .sl-carousel:hover .sl-carousel-track { animation-play-state: paused; }
        @keyframes sl-carousel-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .sl-carousel::before, .sl-carousel::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 60px; z-index: 2; pointer-events: none;
        }
        .sl-carousel::before { left: 0;  background: linear-gradient(to right, rgba(8,13,50,0.9), transparent); }
        .sl-carousel::after  { right: 0; background: linear-gradient(to left,  rgba(8,13,50,0.9), transparent); }

        .sl-slide {
          flex-shrink: 0; width: 200px; padding: 16px; border-radius: 14px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
          backdrop-filter: blur(12px);
          display: flex; flex-direction: column; gap: 10px;
          transition: all 0.2s ease;
        }
        .sl-slide:hover { border-color: rgba(59,110,248,0.35); background: rgba(59,110,248,0.06); }
        .sl-slide-icon  { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .sl-slide-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.88); }
        .sl-slide-desc  { font-size: 11px; color: rgba(255,255,255,0.38); line-height: 1.45; }

        /* ── Stats ── */
        .sl-stats { display: flex; gap: 10px; margin-bottom: 22px; }
        .sl-stat {
          flex: 1; padding: 12px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px); text-align: center;
        }
        .sl-stat-num   { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; line-height: 1; }
        .sl-stat-label { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; }

        /* ── Ticker ── */
        .sl-ticker { overflow: hidden; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 9px 0; margin-bottom: 20px; position: relative; }
        .sl-ticker::before, .sl-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 40px; z-index: 2; pointer-events: none;
        }
        .sl-ticker::before { left: 0;  background: linear-gradient(to right, rgba(8,13,50,0.95), transparent); }
        .sl-ticker::after  { right: 0; background: linear-gradient(to left,  rgba(8,13,50,0.95), transparent); }
        .sl-ticker-track {
          display: flex; gap: 0;
          animation: sl-ticker-scroll 22s linear infinite;
          width: max-content;
        }
        .sl-ticker:hover .sl-ticker-track { animation-play-state: paused; }
        @keyframes sl-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .sl-ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 20px; font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.45); white-space: nowrap;
        }
        .sl-ticker-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        /* ── Info note ── */
        .sl-note {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px;
          border-radius: 11px; background: rgba(59,110,248,0.07); border: 1px solid rgba(59,110,248,0.2);
          backdrop-filter: blur(10px);
        }
        .sl-note-title { font-size: 12px; font-weight: 600; color: #93b4ff; margin-bottom: 3px; }
        .sl-note-desc  { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; }

        .sl-footer {
          display: flex; align-items: center; gap: 7px;
          padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 11px; color: rgba(255,255,255,0.32); margin-top: 16px;
        }

        /* ── RIGHT ── */
        .sl-right {
          position: relative; z-index: 10;
          flex: 1; height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 36px 44px; overflow-y: auto;
          background: linear-gradient(160deg, rgba(37,80,220,0.10) 0%, rgba(59,110,248,0.07) 40%, rgba(109,40,217,0.08) 100%);
          backdrop-filter: blur(12px);
          border-left: 1px solid rgba(255,255,255,0.06);
        }

        .sl-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; justify-content: center;
        }
        @media (min-width: 1024px) { .sl-mobile-brand { display: none; } }

        .sl-form-header { text-align: center; margin-bottom: 26px; }
        .sl-icon-wrap {
          width: 62px; height: 62px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(59,110,248,0.22), rgba(37,80,220,0.14));
          border: 1px solid rgba(59,110,248,0.35);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 0 44px rgba(59,110,248,0.16);
        }
        .sl-title    { font-family: 'Syne', sans-serif; font-size: 23px; font-weight: 700; color: #fff; margin-bottom: 5px; }
        .sl-subtitle { font-size: 13px; color: rgba(255,255,255,0.36); font-weight: 300; }

        .sl-field { margin-bottom: 14px; }
        .sl-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: rgba(255,255,255,0.42); margin-bottom: 6px;
        }
        .sl-input-wrap { position: relative; }
        .sl-input-wrap svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; color: rgba(255,255,255,0.26); pointer-events: none;
        }
        .sl-input {
          width: 100%; height: 46px; padding: 0 14px 0 38px;
          background: rgba(59,110,248,0.08); border: 1px solid rgba(59,110,248,0.18);
          border-radius: 10px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s ease;
        }
        .sl-input::placeholder { color: rgba(255,255,255,0.22); }
        .sl-input:focus {
          background: rgba(59,110,248,0.13); border-color: rgba(59,110,248,0.55);
          box-shadow: 0 0 0 3px rgba(59,110,248,0.12);
        }

        .sl-btn {
          width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #3b6ef8, #2550dc);
          color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 18px; transition: all 0.25s ease;
          box-shadow: 0 6px 26px rgba(59,110,248,0.32);
          position: relative; overflow: hidden;
        }
        .sl-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .sl-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 34px rgba(59,110,248,0.48); }
        .sl-btn:hover::after { opacity: 1; }
        .sl-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .sl-divider { position: relative; margin: 20px 0; text-align: center; }
        .sl-divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(255,255,255,0.07);
        }
        .sl-divider span {
          position: relative; padding: 0 12px;
          font-size: 10px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.1em;
        }

        /* Portal switch links */
        .sl-portals { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .sl-portal-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 10px 12px; border-radius: 9px; text-decoration: none;
          font-size: 12px; font-weight: 600; transition: all 0.2s ease;
          border: 1px solid; backdrop-filter: blur(8px);
        }
        .sl-portal-admin {
          background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.22); color: #fca5a5;
        }
        .sl-portal-admin:hover { background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.38); }
        .sl-portal-emp {
          background: rgba(59,110,248,0.08); border-color: rgba(59,110,248,0.22); color: #93b4ff;
        }
        .sl-portal-emp:hover { background: rgba(59,110,248,0.14); border-color: rgba(59,110,248,0.38); }

        .sl-note-box {
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          font-size: 12px; color: rgba(255,255,255,0.36); text-align: center; line-height: 1.5;
        }

        .sl-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.28); text-decoration: none;
          padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto;
          border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03);
          transition: all 0.2s ease;
        }
        .sl-back:hover { color: rgba(255,255,255,0.52); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }

        .sl-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content;
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.16);
          font-size: 11px; color: rgba(110,231,183,0.7); font-weight: 500;
        }
      `}</style>

      <div className="sl-root">
        <div className="sl-bg"></div>
        <div className="sl-grid"></div>
        <div className="sl-orb sl-orb-1"></div>
        <div className="sl-orb sl-orb-2"></div>

        {/* ── LEFT PANEL ── */}
        <div className="sl-left">
          <div>
            {/* Brand */}
            <div className="sl-brand">
              <div className="sl-brand-icon">
                <ShieldCheck className="w-5 h-5" style={{ color: '#93b4ff' }} />
              </div>
              <div>
                <div className="sl-brand-name">TimeTrack Pro</div>
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
                <div className="sl-stat-num" style={{ color: '#93b4ff' }}>Live</div>
                <div className="sl-stat-label">Site Sync</div>
              </div>
              <div className="sl-stat">
                <div className="sl-stat-num" style={{ color: '#c4b5fd' }}>GPS</div>
                <div className="sl-stat-label">Verified</div>
              </div>
              <div className="sl-stat">
                <div className="sl-stat-num" style={{ color: '#93b4ff' }}>L3</div>
                <div className="sl-stat-label">Access Level</div>
              </div>
            </div>

            {/* Ticker */}
            <div className="sl-ticker">
              <div className="sl-ticker-track">
                {[...tickers, ...tickers].map((t, i) => (
                  <span className="sl-ticker-item" key={i}>
                    <span className="sl-ticker-dot" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }}></span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="sl-note">
              <ShieldCheck className="w-4 h-4" style={{ color: '#93b4ff', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="sl-note-title">Site Administration Access</div>
                <div className="sl-note-desc">Your credentials were provided by your administrator. Contact HR if you have any login issues.</div>
              </div>
            </div>
          </div>

          <div className="sl-footer">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#93b4ff', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="sl-right">
          {/* Mobile brand */}
          <div className="sl-mobile-brand">
            <div className="sl-brand-icon">
              <ShieldCheck className="w-5 h-5" style={{ color: '#93b4ff' }} />
            </div>
            <div>
              <div className="sl-brand-name">TimeTrack Pro</div>
              <div className="sl-brand-sub">Site Admin Officer Portal</div>
            </div>
          </div>

          {/* Header */}
          <div className="sl-form-header">
            <div className="sl-icon-wrap">
              <ShieldCheck className="w-7 h-7" style={{ color: '#93b4ff' }} />
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
            <CheckCircle2 className="w-3 h-3" style={{ color: '#93b4ff' }} />
            Secure · Encrypted · Monitored
          </div>
        </div>
      </div>
    </>
  );
}
