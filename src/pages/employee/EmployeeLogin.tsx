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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#93b4ff', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: 'rgba(147,180,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Loading authentication...</p>
        </div>
      </div>
    );
  }

  const slides = [
    { icon: <Clock className="w-4 h-4" style={{ color: '#93b4ff' }} />,     bg: 'rgba(59,110,248,0.18)',  border: 'rgba(59,110,248,0.32)',  title: 'Clock In / Out',    desc: 'Selfie-verified time tracking for secure attendance' },
    { icon: <FileText className="w-4 h-4" style={{ color: '#c4b5fd' }} />,   bg: 'rgba(147,180,255,0.15)',  border: 'rgba(147,180,255,0.28)',  title: 'View Timesheets',   desc: 'Work hours, overtime and earnings history' },
    { icon: <Calendar className="w-4 h-4" style={{ color: '#a5b4fc' }} />,   bg: 'rgba(196,181,253,0.15)', border: 'rgba(196,181,253,0.28)', title: 'Leave Requests',    desc: 'Submit and track leave applications easily' },
    { icon: <Wallet className="w-4 h-4" style={{ color: '#93b4ff' }} />,     bg: 'rgba(59,110,248,0.18)',  border: 'rgba(59,110,248,0.32)',  title: 'Payslip Access',    desc: 'View and download your monthly payslips' },
    { icon: <BarChart3 className="w-4 h-4" style={{ color: '#c4b5fd' }} />,  bg: 'rgba(147,180,255,0.15)',  border: 'rgba(147,180,255,0.28)',  title: 'Attendance Report', desc: 'Personal attendance summary and analytics' },
    { icon: <UserCircle className="w-4 h-4" style={{ color: '#a5b4fc' }} />, bg: 'rgba(196,181,253,0.15)', border: 'rgba(196,181,253,0.28)', title: 'My Profile',        desc: 'Update personal info and preferences' },
  ];

  const tickers = [
    { label: 'Real-Time Clock In/Out',      color: '#93b4ff' },
    { label: 'Selfie Verification',          color: '#c4b5fd' },
    { label: 'Leave Management',             color: '#a5b4fc' },
    { label: 'Timesheet Access',             color: '#93b4ff' },
    { label: 'Payslip Downloads',            color: '#c4b5fd' },
    { label: 'Overtime Tracking',            color: '#a5b4fc' },
    { label: 'Attendance Summary',           color: '#93b4ff' },
    { label: 'Personal Document Vault',      color: '#c4b5fd' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .el-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh; width: 100vw;
          display: flex; overflow: hidden;
          position: relative; background: #050814;
        }

        .el-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80');
          background-size: cover; background-position: center;
        }
        .el-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(8,13,38,0.95) 0%, rgba(4,7,20,0.91) 50%, rgba(12,8,30,0.95) 100%);
        }

        .el-grid {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .el-orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 1; filter: blur(100px); opacity: 0.14; }
        .el-orb-1 { width: 600px; height: 600px; top: -200px; left: -150px; background: radial-gradient(circle, #3b6ef8, transparent); }
        .el-orb-2 { width: 450px; height: 450px; bottom: -150px; right: -100px; background: radial-gradient(circle, #7c3bf8, transparent); }
        .el-orb-3 { width: 350px; height: 350px; top: 40%; right: 20%; background: radial-gradient(circle, #7c3bf8, transparent); opacity: 0.07; }

        /* ── LEFT ── */
        .el-left {
          position: relative; z-index: 10;
          width: 55%; height: 100vh;
          display: none; flex-direction: column; justify-content: center;
          padding: 40px 48px;
          border-right: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(160deg, rgba(59,110,248,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(124,59,248,0.05) 100%);
          backdrop-filter: blur(8px);
          overflow-y: auto; gap: 0;
        }
        @media (min-width: 1024px) { .el-left { display: flex; } }

        .el-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .el-brand-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(59,110,248,0.2); border: 1px solid rgba(59,110,248,0.35);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 22px rgba(59,110,248,0.18);
        }
        .el-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #fff; }
        .el-brand-sub  { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-top: 2px; }

        .el-headline { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #fff; line-height: 1.22; margin-bottom: 8px; }
        .el-headline span {
          background: linear-gradient(90deg, #93b4ff, #c4b5fd, #6ee7b7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .el-desc { font-size: 13px; font-weight: 300; color: rgba(255,255,255,0.4); line-height: 1.65; margin-bottom: 28px; }

        /* ── Carousel ── */
        .el-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 24px; }
        .el-carousel-track {
          display: flex; gap: 14px;
          animation: el-carousel-slide 18s linear infinite;
          width: max-content;
        }
        .el-carousel:hover .el-carousel-track { animation-play-state: paused; }
        @keyframes el-carousel-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .el-carousel::before, .el-carousel::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 60px; z-index: 2; pointer-events: none;
        }
        .el-carousel::before { left: 0;  background: linear-gradient(to right, rgba(8,13,38,0.92), transparent); }
        .el-carousel::after  { right: 0; background: linear-gradient(to left,  rgba(8,13,38,0.92), transparent); }

        .el-slide {
          flex-shrink: 0; width: 200px; padding: 16px; border-radius: 14px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          display: flex; flex-direction: column; gap: 10px;
          transition: all 0.2s ease;
        }
        .el-slide:hover { border-color: rgba(59,110,248,0.38); background: rgba(59,110,248,0.06); }
        .el-slide-icon  { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .el-slide-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.88); }
        .el-slide-desc  { font-size: 11px; color: rgba(255,255,255,0.38); line-height: 1.45; }

        /* ── Stats ── */
        .el-stats { display: flex; gap: 10px; margin-bottom: 22px; }
        .el-stat {
          flex: 1; padding: 12px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px); text-align: center;
        }
        .el-stat-num   { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; line-height: 1; }
        .el-stat-label { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; }

        /* ── Ticker ── */
        .el-ticker { overflow: hidden; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); padding: 9px 0; margin-bottom: 20px; position: relative; }
        .el-ticker::before, .el-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 40px; z-index: 2; pointer-events: none;
        }
        .el-ticker::before { left: 0;  background: linear-gradient(to right, rgba(8,13,38,0.95), transparent); }
        .el-ticker::after  { right: 0; background: linear-gradient(to left,  rgba(8,13,38,0.95), transparent); }
        .el-ticker-track {
          display: flex; gap: 0;
          animation: el-ticker-scroll 22s linear infinite;
          width: max-content;
        }
        .el-ticker:hover .el-ticker-track { animation-play-state: paused; }
        @keyframes el-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .el-ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 20px; font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,0.45); white-space: nowrap;
        }
        .el-ticker-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        /* ── Info note ── */
        .el-note {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px;
          border-radius: 11px;
          background: rgba(59,110,248,0.08); border: 1px solid rgba(59,110,248,0.22);
          backdrop-filter: blur(10px);
        }
        .el-note-title { font-size: 12px; font-weight: 600; color: #c4b5fd; margin-bottom: 3px; }
        .el-note-desc  { font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; }

        .el-footer {
          display: flex; align-items: center; gap: 7px;
          padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 11px; color: rgba(255,255,255,0.32); margin-top: 16px;
        }

        /* ── RIGHT ── */
        .el-right {
          position: relative; z-index: 10;
          flex: 1; height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 36px 44px; overflow-y: auto;
          background: linear-gradient(160deg, rgba(37,80,220,0.12) 0%, rgba(59,110,248,0.08) 40%, rgba(109,40,217,0.10) 100%);
          backdrop-filter: blur(12px);
          border-left: 1px solid rgba(255,255,255,0.06);
        }

        .el-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; justify-content: center;
        }
        @media (min-width: 1024px) { .el-mobile-brand { display: none; } }

        .el-form-header { text-align: center; margin-bottom: 26px; }
        .el-icon-wrap {
          width: 62px; height: 62px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(59,110,248,0.28), rgba(37,80,220,0.18));
          border: 1px solid rgba(59,110,248,0.38);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 0 44px rgba(59,110,248,0.2);
        }
        .el-title    { font-family: 'Syne', sans-serif; font-size: 23px; font-weight: 700; color: #fff; margin-bottom: 5px; }
        .el-subtitle { font-size: 13px; color: rgba(255,255,255,0.36); font-weight: 300; }

        .el-field { margin-bottom: 14px; }
        .el-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: rgba(255,255,255,0.42); margin-bottom: 6px;
        }
        .el-input-wrap { position: relative; }
        .el-input-wrap svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; color: rgba(255,255,255,0.26); pointer-events: none;
        }
        .el-input {
          width: 100%; height: 46px; padding: 0 14px 0 38px;
          background: rgba(59,110,248,0.08); border: 1px solid rgba(59,110,248,0.22);
          border-radius: 10px; color: #fff; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s ease;
        }
        .el-input::placeholder { color: rgba(255,255,255,0.22); }
        .el-input:focus {
          background: rgba(59,110,248,0.13); border-color: rgba(59,110,248,0.58);
          box-shadow: 0 0 0 3px rgba(59,110,248,0.12);
        }

        .el-btn {
          width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #3b6ef8, #2550dc);
          color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 18px; transition: all 0.25s ease;
          box-shadow: 0 6px 26px rgba(37,80,220,0.35);
          position: relative; overflow: hidden;
        }
        .el-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .el-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 34px rgba(37,80,220,0.52); }
        .el-btn:hover::after { opacity: 1; }
        .el-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .el-divider { position: relative; margin: 20px 0; text-align: center; }
        .el-divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(255,255,255,0.07);
        }
        .el-divider span {
          position: relative; padding: 0 12px;
          font-size: 10px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.1em;
        }

        .el-note-box {
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          font-size: 12px; color: rgba(255,255,255,0.36); text-align: center; line-height: 1.5;
        }

        .el-admin-box {
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: rgba(59,110,248,0.07); border: 1px solid rgba(59,110,248,0.2);
          font-size: 12px; text-align: center; line-height: 1.5;
        }
        .el-admin-box span { color: #c4b5fd; font-weight: 600; }
        .el-admin-box a { color: #93b4ff; font-weight: 600; text-decoration: none; }
        .el-admin-box a:hover { color: #c4b5fd; text-decoration: underline; }

        .el-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.28); text-decoration: none;
          padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto;
          border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03);
          transition: all 0.2s ease;
        }
        .el-back:hover { color: rgba(255,255,255,0.52); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); }

        .el-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content;
          background: rgba(59,110,248,0.08); border: 1px solid rgba(59,110,248,0.18);
          font-size: 11px; color: rgba(196,181,253,0.75); font-weight: 500;
        }

        .el-copyright {
          text-align: center; font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 14px;
        }
      `}</style>

      <div className="el-root">
        <div className="el-bg"></div>
        <div className="el-grid"></div>
        <div className="el-orb el-orb-1"></div>
        <div className="el-orb el-orb-2"></div>
        <div className="el-orb el-orb-3"></div>

        {/* ── LEFT PANEL ── */}
        <div className="el-left">
          <div>
            {/* Brand */}
            <div className="el-brand">
              <div className="el-brand-icon">
                <Clock className="w-5 h-5" style={{ color: '#93b4ff' }} />
              </div>
              <div>
                <div className="el-brand-name">TimeTrack Pro</div>
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
                <div className="el-stat-num" style={{ color: '#93b4ff' }}>Live</div>
                <div className="el-stat-label">Attendance</div>
              </div>
              <div className="el-stat">
                <div className="el-stat-num" style={{ color: '#c4b5fd' }}>24/7</div>
                <div className="el-stat-label">Access</div>
              </div>
              <div className="el-stat">
                <div className="el-stat-num" style={{ color: '#6ee7b7' }}>L2</div>
                <div className="el-stat-label">Access Level</div>
              </div>
            </div>

            {/* Ticker */}
            <div className="el-ticker">
              <div className="el-ticker-track">
                {[...tickers, ...tickers].map((t, i) => (
                  <span className="el-ticker-item" key={i}>
                    <span className="el-ticker-dot" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }}></span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="el-note">
              <UserCircle className="w-4 h-4" style={{ color: '#c4b5fd', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="el-note-title">Employee Self-Service</div>
                <div className="el-note-desc">Your credentials were provided by your administrator. Contact HR if you have any login issues.</div>
              </div>
            </div>
          </div>

          <div className="el-footer">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#93b4ff', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="el-right">
          {/* Mobile brand */}
          <div className="el-mobile-brand">
            <div className="el-brand-icon">
              <Clock className="w-5 h-5" style={{ color: '#93b4ff' }} />
            </div>
            <div>
              <div className="el-brand-name">TimeTrack Pro</div>
              <div className="el-brand-sub">Employee Self-Service Portal</div>
            </div>
          </div>

          {/* Header */}
          <div className="el-form-header">
            <div className="el-icon-wrap">
              <UserCircle className="w-7 h-7" style={{ color: '#93b4ff' }} />
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
            <CheckCircle2 className="w-3 h-3" style={{ color: '#93b4ff' }} />
            Secure · Encrypted · Monitored
          </div>

         
        </div>
      </div>
    </>
  );
}
