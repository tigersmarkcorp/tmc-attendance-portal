import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, Lock, Mail, Users, BarChart3, Settings, FileText, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        toast({
          title: 'Access Denied',
          description: 'You do not have administrator privileges. Please use the employee login.',
          variant: 'destructive',
        });
        navigate('/employee/login');
      }
    }
  }, [user, role, authLoading, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginSchema.parse({ email: email.trim(), password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Validation Error', description: err.errors[0].message, variant: 'destructive' });
        return;
      }
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' ? 'Invalid email or password. Please try again.' : error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f97316', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: '#c2410c', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Loading authentication...
          </p>
        </div>
      </div>
    );
  }

  const featureSlides = [
    { icon: <Users    className="w-4 h-4" style={{ color: '#f97316' }} />, bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.22)', title: 'Employee Directory', desc: 'Centralized workforce database management' },
    { icon: <BarChart3 className="w-4 h-4" style={{ color: '#ea580c' }} />, bg: 'rgba(234,88,12,0.10)',  border: 'rgba(234,88,12,0.22)',  title: 'Analytics Suite',     desc: 'Real-time insights & advanced reporting' },
    { icon: <FileText  className="w-4 h-4" style={{ color: '#fb923c' }} />, bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.22)', title: 'Payroll Engine',      desc: 'Automated processing & compliance' },
    { icon: <Settings  className="w-4 h-4" style={{ color: '#c2410c' }} />, bg: 'rgba(194,65,12,0.10)',  border: 'rgba(194,65,12,0.22)',  title: 'System Config',      desc: 'Customizable policies & workflows' },
    { icon: <Shield    className="w-4 h-4" style={{ color: '#f97316' }} />, bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.22)', title: 'Access Control',     desc: 'Role-based permissions & audit logs' },
    { icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#ea580c' }} />, bg: 'rgba(234,88,12,0.10)', border: 'rgba(234,88,12,0.22)', title: 'Compliance',       desc: 'Regulatory reporting & documentation' },
  ];

  const tickerItems = [
    { label: 'Real-Time Attendance Sync', color: '#f97316' },
    { label: 'Biometric Integration',     color: '#ea580c' },
    { label: 'Multi-Site Management',     color: '#fb923c' },
    { label: 'Payroll Automation',        color: '#fdba74' },
    { label: 'Compliance Reporting',      color: '#f97316' },
    { label: 'Role-Based Access',         color: '#ea580c' },
    { label: 'Audit Trail Logging',       color: '#fb923c' },
    { label: 'Leave Management',          color: '#fdba74' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes carousel-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-scroll {
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
        .al-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh;
          width: 100vw;
          display: flex;
          overflow: hidden;
          position: relative;
          background: #fff7ed;
          isolation: isolate;
        }

        /* ── BG ── */
        .al-bg {
          position: fixed; inset: 0; z-index: -3;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=55');
          background-size: cover; background-position: center;
          transform: translateZ(0);
        }
        .al-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(
            160deg,
            rgba(255,247,237,0.96) 0%,
            rgba(255,237,213,0.93) 50%,
            rgba(254,215,170,0.95) 100%
          );
        }

        /* ── GRID ── */
        .al-grid {
          position: fixed; inset: 0; z-index: -2; pointer-events: none;
          background-image:
            linear-gradient(rgba(249,115,22,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.07) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        /* ── ORBS — no filter:blur, pure radial gradient ── */
        .al-orb {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: -1;
          transform: translateZ(0);
          animation: orb-pulse 11s ease-in-out infinite;
        }
        .al-orb-1 {
          width: 560px; height: 560px; top: -200px; left: -160px;
          background: radial-gradient(circle at center, rgba(249,115,22,0.22), transparent 68%);
        }
        .al-orb-2 {
          width: 440px; height: 440px; bottom: -150px; right: -110px;
          background: radial-gradient(circle at center, rgba(251,146,60,0.18), transparent 68%);
          animation-delay: -5.5s;
        }

        /* ── LEFT PANEL ── */
        .al-left {
          position: relative; z-index: 10;
          width: 55%; height: 100vh;
          display: none; flex-direction: column; justify-content: space-between;
          padding: 36px 44px;
          border-right: 1px solid rgba(249,115,22,0.18);
          background: rgba(255,255,255,0.55);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          overflow-y: auto;
          animation: fade-up 0.55s ease both;
        }
        @media (min-width: 1024px) { .al-left { display: flex; } }

        /* ── Brand ── */
        .al-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .al-brand-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.28);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px rgba(249,115,22,0.18);
        }
        .al-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #7c2d12; }
        .al-brand-sub  { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: #c2410c; margin-top: 2px; opacity: 0.7; }

        /* ── Headline ── */
        .al-headline { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #431407; line-height: 1.22; margin-bottom: 8px; }
        .al-headline span {
          background: linear-gradient(90deg, #f97316, #ea580c, #fb923c);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .al-desc { font-size: 13px; font-weight: 300; color: #9a3412; line-height: 1.65; margin-bottom: 24px; opacity: 0.75; }

        /* ── Feature carousel ── */
        .al-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 22px; }
        .al-carousel-track {
          display: flex; gap: 13px;
          animation: carousel-slide 18s linear infinite;
          width: max-content;
        }
        .al-carousel:hover .al-carousel-track { animation-play-state: paused; }
        .al-carousel::before, .al-carousel::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 55px; z-index: 2; pointer-events: none;
        }
        .al-carousel::before { left: 0;  background: linear-gradient(to right, rgba(255,247,237,0.95), transparent); }
        .al-carousel::after  { right: 0; background: linear-gradient(to left,  rgba(255,247,237,0.95), transparent); }

        .al-slide {
          flex-shrink: 0; width: 192px;
          padding: 15px; border-radius: 13px;
          background: rgba(255,255,255,0.75); border: 1px solid rgba(249,115,22,0.18);
          display: flex; flex-direction: column; gap: 9px;
          box-shadow: 0 2px 10px rgba(249,115,22,0.08);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .al-slide:hover { border-color: rgba(249,115,22,0.38); background: rgba(255,255,255,0.92); box-shadow: 0 4px 18px rgba(249,115,22,0.14); }
        .al-slide-icon  { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .al-slide-title { font-size: 12.5px; font-weight: 600; color: #431407; }
        .al-slide-desc  { font-size: 11px; color: #9a3412; line-height: 1.45; opacity: 0.7; }

        /* ── Stats row ── */
        .al-stats { display: flex; gap: 10px; margin-bottom: 20px; }
        .al-stat {
          flex: 1; padding: 11px 12px; border-radius: 11px; text-align: center;
          background: rgba(255,255,255,0.70); border: 1px solid rgba(249,115,22,0.16);
          box-shadow: 0 2px 8px rgba(249,115,22,0.07);
        }
        .al-stat-num   { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700; line-height: 1; }
        .al-stat-label { font-size: 9.5px; color: #9a3412; margin-top: 4px; letter-spacing: 0.07em; text-transform: uppercase; opacity: 0.75; }

        /* ── Ticker ── */
        .al-ticker {
          overflow: hidden; padding: 8px 0; margin-bottom: 18px;
          border-top: 1px solid rgba(249,115,22,0.15); border-bottom: 1px solid rgba(249,115,22,0.15);
          position: relative;
        }
        .al-ticker::before, .al-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 36px; z-index: 2; pointer-events: none;
        }
        .al-ticker::before { left: 0;  background: linear-gradient(to right, rgba(255,247,237,0.95), transparent); }
        .al-ticker::after  { right: 0; background: linear-gradient(to left,  rgba(255,247,237,0.95), transparent); }
        .al-ticker-track {
          display: flex;
          animation: ticker-scroll 22s linear infinite;
          width: max-content;
        }
        .al-ticker:hover .al-ticker-track { animation-play-state: paused; }
        .al-ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 18px; font-size: 11px; font-weight: 500;
          color: #9a3412; white-space: nowrap; opacity: 0.8;
        }
        .al-ticker-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        /* ── Alert ── */
        .al-alert {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px;
          border-radius: 11px;
          background: rgba(254,226,226,0.5); border: 1px solid rgba(239,68,68,0.2);
        }
        .al-alert-title { font-size: 12px; font-weight: 600; color: #dc2626; margin-bottom: 3px; }
        .al-alert-desc  { font-size: 11px; color: #9a3412; line-height: 1.5; opacity: 0.8; }

        /* ── Left Footer ── */
        .al-footer {
          display: flex; align-items: center; gap: 7px;
          padding-top: 16px; margin-top: 16px;
          border-top: 1px solid rgba(249,115,22,0.14);
          font-size: 11px; color: #c2410c; opacity: 0.7;
        }

        /* ── RIGHT PANEL ── */
        .al-right {
          position: relative; z-index: 10;
          flex: 1; height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 36px 40px;
          overflow-y: auto;
          background: rgba(255,255,255,0.70);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          border-left: 1px solid rgba(249,115,22,0.14);
          animation: fade-up 0.55s 0.08s ease both;
        }

        .al-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; justify-content: center;
        }
        @media (min-width: 1024px) { .al-mobile-brand { display: none; } }

        .al-form-header { text-align: center; margin-bottom: 26px; }
        .al-icon-wrap {
          width: 62px; height: 62px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(249,115,22,0.14), rgba(234,88,12,0.08));
          border: 1px solid rgba(249,115,22,0.28);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 4px 24px rgba(249,115,22,0.18);
        }

        .al-title    { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #431407; margin-bottom: 5px; }
        .al-subtitle { font-size: 13px; color: #9a3412; font-weight: 300; opacity: 0.75; }

        .al-field { margin-bottom: 14px; }
        .al-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: #c2410c; margin-bottom: 6px; opacity: 0.85;
        }
        .al-input-wrap { position: relative; }
        .al-input-wrap svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; color: rgba(249,115,22,0.55); pointer-events: none;
        }
        .al-input {
          width: 100%; height: 46px; padding: 0 14px 0 38px;
          background: rgba(255,255,255,0.85); border: 1px solid rgba(249,115,22,0.22);
          border-radius: 10px; color: #431407; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(249,115,22,0.07);
        }
        .al-input::placeholder { color: rgba(194,65,12,0.35); }
        .al-input:focus {
          background: #fff;
          border-color: rgba(249,115,22,0.55);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }

        /* CTA button */
        .al-btn {
          width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 18px; transition: box-shadow 0.25s ease, transform 0.2s ease;
          box-shadow: 0 6px 26px rgba(249,115,22,0.35);
          position: relative; overflow: hidden;
          transform: translateZ(0);
        }
        .al-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.16), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .al-btn:hover { transform: translateY(-1px) translateZ(0); box-shadow: 0 10px 34px rgba(249,115,22,0.48); }
        .al-btn:hover::after { opacity: 1; }
        .al-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Divider */
        .al-divider { position: relative; margin: 20px 0; text-align: center; }
        .al-divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(249,115,22,0.15);
        }
        .al-divider span {
          position: relative; padding: 0 12px;
          font-size: 10px; color: #c2410c; text-transform: uppercase; letter-spacing: 0.1em;
          background: rgba(255,255,255,0.70); opacity: 0.65;
        }

        /* Employee link */
        .al-emp-link { text-align: center; font-size: 13px; color: #9a3412; margin-bottom: 12px; opacity: 0.8; }
        .al-emp-link a { color: #f97316; font-weight: 600; text-decoration: none; }
        .al-emp-link a:hover { color: #ea580c; text-decoration: underline; }

        /* Back link */
        .al-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #9a3412; text-decoration: none;
          padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto;
          border: 1px solid rgba(249,115,22,0.2); background: rgba(249,115,22,0.06);
          transition: all 0.2s ease; opacity: 0.85;
        }
        .al-back:hover { color: #f97316; background: rgba(249,115,22,0.12); border-color: rgba(249,115,22,0.35); opacity: 1; }

        /* Secure badge */
        .al-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content;
          background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.20);
          font-size: 11px; color: #c2410c; font-weight: 500;
        }
      `}</style>

      <div className="al-root">
        <div className="al-bg" />
        <div className="al-grid" />
        <div className="al-orb al-orb-1" />
        <div className="al-orb al-orb-2" />

        {/* ── LEFT PANEL ── */}
        <div className="al-left">
          <div>
            <div className="al-brand">
              <div className="al-brand-icon">
                <Shield className="w-5 h-5" style={{ color: '#f97316' }} />
              </div>
              <div>
                <div className="al-brand-name">TMC TimeTrack Pro</div>
                <div className="al-brand-sub">Administration Portal</div>
              </div>
            </div>

            <h2 className="al-headline">Enterprise <span>Workforce</span><br />Management Platform</h2>
            <p className="al-desc">
              Streamline attendance tracking, payroll processing, and employee management with comprehensive administrative controls.
            </p>

            {/* Feature carousel */}
            <div className="al-carousel">
              <div className="al-carousel-track">
                {[...featureSlides, ...featureSlides].map((s, i) => (
                  <div className="al-slide" key={i}>
                    <div className="al-slide-icon" style={{ background: s.bg, border: `1px solid ${s.border}` }}>{s.icon}</div>
                    <div className="al-slide-title">{s.title}</div>
                    <div className="al-slide-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="al-stats">
              <div className="al-stat">
                <div className="al-stat-num" style={{ color: '#f97316' }}>Live</div>
                <div className="al-stat-label">Attendance</div>
              </div>
              <div className="al-stat">
                <div className="al-stat-num" style={{ color: '#fb923c' }}>24/7</div>
                <div className="al-stat-label">Monitored</div>
              </div>
              <div className="al-stat">
                <div className="al-stat-num" style={{ color: '#ea580c' }}>L4</div>
                <div className="al-stat-label">ACCESS LEVEL</div>
              </div>
            </div>

            {/* Ticker */}
            <div className="al-ticker">
              <div className="al-ticker-track">
                {[...tickerItems, ...tickerItems].map((t, i) => (
                  <span className="al-ticker-item" key={i}>
                    <span className="al-ticker-dot" style={{ background: t.color, boxShadow: `0 0 5px ${t.color}` }} />
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Alert */}
            <div className="al-alert">
              <AlertCircle className="w-4 h-4" style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="al-alert-title">Restricted Access Portal</div>
                <div className="al-alert-desc">Restricted to authorized administrators only. All access attempts are monitored and logged for security compliance.</div>
              </div>
            </div>
          </div>

          <div className="al-footer">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#f97316', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="al-right">
          {/* Mobile brand */}
          <div className="al-mobile-brand">
            <div className="al-brand-icon">
              <Shield className="w-5 h-5" style={{ color: '#f97316' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#7c2d12' }}>TimeTrack Pro</div>
              <div className="al-brand-sub">Administration Portal</div>
            </div>
          </div>

          <div className="al-form-header">
            <div className="al-icon-wrap">
              <Lock className="w-7 h-7" style={{ color: '#f97316' }} />
            </div>
            <h1 className="al-title">Administrator Access</h1>
            <p className="al-subtitle">Enter your credentials to access the admin dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="al-field">
              <label className="al-label" htmlFor="email">Email Address</label>
              <div className="al-input-wrap">
                <Mail />
                <input
                  id="email"
                  type="email"
                  placeholder="administrator@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="al-input"
                />
              </div>
            </div>

            <div className="al-field">
              <label className="al-label" htmlFor="password">Password</label>
              <div className="al-input-wrap">
                <Lock />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="al-input"
                />
              </div>
            </div>

            <button type="submit" className="al-btn" disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                : <><Shield className="w-4 h-4" /> Sign In to Administrator Portal</>
              }
            </button>
          </form>

          <div className="al-divider"><span>or</span></div>

          <div className="al-emp-link">
            Not an administrator?{' '}
            <Link to="/employee/login">Employee Login</Link>
          </div>

          <Link to="/" className="al-back">
            <Building2 className="w-3.5 h-3.5" />
            Return to Portal Selection
          </Link>

          <div className="al-secure">
            <CheckCircle2 className="w-3 h-3" style={{ color: '#f97316' }} />
            Secure · Encrypted · Monitored
          </div>
        </div>
      </div>
    </>
  );
}
