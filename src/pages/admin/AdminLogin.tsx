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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b6ef8', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 12, color: '#6b7eb8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .al-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh;
          width: 100vw;
          display: flex;
          overflow: hidden;
          position: relative;
          background: #f5f7ff;
        }

        .al-bg {
          position: fixed; inset: 0; z-index: 0;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80');
          background-size: cover; background-position: center;
        }
        .al-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(240,245,255,0.96) 0%, rgba(235,242,255,0.94) 50%, rgba(242,238,255,0.96) 100%);
        }

        .al-grid {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image:
            linear-gradient(rgba(59,110,248,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,110,248,0.045) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .al-orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: 1; filter: blur(100px); opacity: 0.18; }
        .al-orb-1 { width: 600px; height: 600px; top: -200px; left: -150px; background: radial-gradient(circle, #93b4ff, transparent); }
        .al-orb-2 { width: 450px; height: 450px; bottom: -150px; right: -100px; background: radial-gradient(circle, #c4b5fd, transparent); }

        /* ── LEFT ── */
        .al-left {
          position: relative; z-index: 10;
          width: 55%; height: 100vh;
          display: none; flex-direction: column; justify-content: center;
          padding: 40px 48px;
          border-right: 1px solid rgba(59,110,248,0.12);
          background: linear-gradient(160deg, rgba(59,110,248,0.06) 0%, rgba(255,255,255,0.5) 50%, rgba(124,59,248,0.04) 100%);
          backdrop-filter: blur(8px);
          overflow-y: auto;
          gap: 0;
        }
        @media (min-width: 1024px) { .al-left { display: flex; } }

        .al-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .al-brand-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: rgba(59,110,248,0.12); border: 1px solid rgba(59,110,248,0.25);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(59,110,248,0.12);
        }
        .al-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #1a2563; }
        .al-brand-sub { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: #7b8cc4; margin-top: 2px; }

        /* ── Headline ── */
        .al-headline { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; color: #1a2563; line-height: 1.22; margin-bottom: 8px; }
        .al-headline span {
          background: linear-gradient(90deg, #3b6ef8, #7c3bf8, #0ea88b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .al-desc { font-size: 13px; font-weight: 300; color: #6b7eb8; line-height: 1.65; margin-bottom: 28px; }

        /* ── Carousel ── */
        .al-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 24px; }
        .al-carousel-track {
          display: flex; gap: 14px;
          animation: carousel-slide 18s linear infinite;
          width: max-content;
        }
        .al-carousel:hover .al-carousel-track { animation-play-state: paused; }

        @keyframes carousel-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* fade edges */
        .al-carousel::before, .al-carousel::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 60px; z-index: 2; pointer-events: none;
        }
        .al-carousel::before { left: 0; background: linear-gradient(to right, rgba(240,244,255,0.9), transparent); }
        .al-carousel::after  { right: 0; background: linear-gradient(to left,  rgba(240,244,255,0.9), transparent); }

        .al-slide {
          flex-shrink: 0; width: 200px;
          padding: 16px; border-radius: 14px;
          background: rgba(255,255,255,0.7); border: 1px solid rgba(59,110,248,0.12);
          backdrop-filter: blur(12px);
          display: flex; flex-direction: column; gap: 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 12px rgba(59,110,248,0.06);
        }
        .al-slide:hover { border-color: rgba(59,110,248,0.25); background: rgba(255,255,255,0.9); box-shadow: 0 4px 20px rgba(59,110,248,0.1); }
        .al-slide-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .al-slide-title { font-size: 13px; font-weight: 600; color: #1a2563; }
        .al-slide-desc  { font-size: 11px; color: #7b8cc4; line-height: 1.45; }

        /* ── Stat pills row ── */
        .al-stats { display: flex; gap: 10px; margin-bottom: 22px; }
        .al-stat {
          flex: 1; padding: 12px 14px; border-radius: 12px;
          background: rgba(255,255,255,0.7); border: 1px solid rgba(59,110,248,0.1);
          backdrop-filter: blur(10px); text-align: center;
          box-shadow: 0 2px 8px rgba(59,110,248,0.05);
        }
        .al-stat-num { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #1a2563; line-height: 1; }
        .al-stat-label { font-size: 10px; color: #7b8cc4; margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; }

        /* ── Marquee ticker ── */
        .al-ticker { overflow: hidden; border-top: 1px solid rgba(59,110,248,0.1); border-bottom: 1px solid rgba(59,110,248,0.1); padding: 9px 0; margin-bottom: 20px; position: relative; }
        .al-ticker::before, .al-ticker::after {
          content: ''; position: absolute; top: 0; bottom: 0; width: 40px; z-index: 2; pointer-events: none;
        }
        .al-ticker::before { left: 0; background: linear-gradient(to right, rgba(240,244,255,0.95), transparent); }
        .al-ticker::after  { right: 0; background: linear-gradient(to left,  rgba(240,244,255,0.95), transparent); }
        .al-ticker-track {
          display: flex; gap: 0;
          animation: ticker-scroll 22s linear infinite;
          width: max-content;
        }
        .al-ticker:hover .al-ticker-track { animation-play-state: paused; }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .al-ticker-item {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0 20px; font-size: 11px; font-weight: 500;
          color: #7b8cc4; white-space: nowrap;
        }
        .al-ticker-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        /* ── Alert ── */
        .al-alert {
          display: flex; align-items: flex-start; gap: 10px; padding: 13px;
          border-radius: 11px; background: rgba(254,226,226,0.5); border: 1px solid rgba(239,68,68,0.2);
          backdrop-filter: blur(10px);
        }
        .al-alert-title { font-size: 12px; font-weight: 600; color: #dc2626; margin-bottom: 3px; }
        .al-alert-desc  { font-size: 11px; color: #6b7eb8; line-height: 1.5; }

        .al-footer {
          display: flex; align-items: center; gap: 7px;
          padding-top: 16px; border-top: 1px solid rgba(59,110,248,0.1);
          font-size: 11px; color: #7b8cc4; margin-top: 16px;
        }

        /* ── RIGHT ── */
        .al-right {
          position: relative; z-index: 10;
          flex: 1; height: 100vh;
          display: flex; flex-direction: column; justify-content: center;
          padding: 36px 44px;
          overflow-y: auto;
          background: linear-gradient(160deg, rgba(255,255,255,0.85) 0%, rgba(248,250,255,0.9) 40%, rgba(252,248,255,0.85) 100%);
          backdrop-filter: blur(16px);
          border-left: 1px solid rgba(59,110,248,0.1);
        }

        .al-mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 24px; justify-content: center;
        }
        @media (min-width: 1024px) { .al-mobile-brand { display: none; } }

        .al-form-header { text-align: center; margin-bottom: 26px; }

        .al-icon-wrap {
          width: 62px; height: 62px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(59,110,248,0.14), rgba(37,80,220,0.08));
          border: 1px solid rgba(59,110,248,0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 4px 24px rgba(59,110,248,0.14);
        }

        .al-title { font-family: 'Syne', sans-serif; font-size: 23px; font-weight: 700; color: #1a2563; margin-bottom: 5px; }
        .al-subtitle { font-size: 13px; color: #7b8cc4; font-weight: 300; }

        .al-field { margin-bottom: 14px; }
        .al-field:last-of-type { margin-bottom: 0; }

        .al-label {
          display: block; font-size: 10px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          color: #7b8cc4; margin-bottom: 6px;
        }
        .al-input-wrap { position: relative; }
        .al-input-wrap svg {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; color: #a0b0d8; pointer-events: none;
        }
        .al-input {
          width: 100%; height: 46px; padding: 0 14px 0 38px;
          background: rgba(255,255,255,0.9); border: 1px solid rgba(59,110,248,0.18);
          border-radius: 10px; color: #1a2563; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(59,110,248,0.06);
        }
        .al-input::placeholder { color: #b0bedd; }
        .al-input:focus {
          background: #fff; border-color: rgba(59,110,248,0.5);
          box-shadow: 0 0 0 3px rgba(59,110,248,0.1);
        }

        .al-btn {
          width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #3b6ef8, #2550dc);
          color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 18px; transition: all 0.25s ease;
          box-shadow: 0 6px 26px rgba(59,110,248,0.28);
          position: relative; overflow: hidden;
        }
        .al-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.25s;
        }
        .al-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 34px rgba(59,110,248,0.38); }
        .al-btn:hover::after { opacity: 1; }
        .al-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .al-divider { position: relative; margin: 20px 0; text-align: center; }
        .al-divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0;
          height: 1px; background: rgba(59,110,248,0.1);
        }
        .al-divider span {
          position: relative; padding: 0 12px;
          font-size: 10px; color: #a0b0d8; text-transform: uppercase; letter-spacing: 0.1em;
          background: rgba(248,250,255,0.9);
        }

        .al-emp-link { text-align: center; font-size: 13px; color: #7b8cc4; margin-bottom: 12px; }
        .al-emp-link a { color: #3b6ef8; font-weight: 600; text-decoration: none; }
        .al-emp-link a:hover { color: #2550dc; text-decoration: underline; }

        .al-back {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 12px; color: #7b8cc4; text-decoration: none;
          padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto;
          border: 1px solid rgba(59,110,248,0.14); background: rgba(255,255,255,0.6);
          transition: all 0.2s ease;
        }
        .al-back:hover { color: #3b6ef8; background: rgba(59,110,248,0.06); border-color: rgba(59,110,248,0.25); }

        .al-secure {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content;
          background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.18);
          font-size: 11px; color: #059669; font-weight: 500;
        }
      `}</style>

      <div className="al-root">
        <div className="al-bg"></div>
        <div className="al-grid"></div>
        <div className="al-orb al-orb-1"></div>
        <div className="al-orb al-orb-2"></div>

        {/* LEFT PANEL */}
        <div className="al-left">
          <div>
            <div className="al-brand">
              <div className="al-brand-icon">
                <Shield className="w-5 h-5" style={{ color: '#3b6ef8' }} />
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

            {/* ── Scrolling carousel of feature cards ── */}
            <div className="al-carousel">
              <div className="al-carousel-track">
                {/* Original set */}
                {[
                  { icon: <Users className="w-4 h-4" style={{ color: '#3b6ef8' }} />, bg: 'rgba(59,110,248,0.1)', border: 'rgba(59,110,248,0.2)', title: 'Employee Directory', desc: 'Centralized workforce database management' },
                  { icon: <BarChart3 className="w-4 h-4" style={{ color: '#059669' }} />, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', title: 'Analytics Suite', desc: 'Real-time insights & advanced reporting' },
                  { icon: <FileText className="w-4 h-4" style={{ color: '#7c3bf8' }} />, bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', title: 'Payroll Engine', desc: 'Automated processing & compliance' },
                  { icon: <Settings className="w-4 h-4" style={{ color: '#d97706' }} />, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', title: 'System Config', desc: 'Customizable policies & workflows' },
                  { icon: <Shield className="w-4 h-4" style={{ color: '#dc2626' }} />, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', title: 'Access Control', desc: 'Role-based permissions & audit logs' },
                  { icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', title: 'Compliance', desc: 'Regulatory reporting & documentation' },
                ].map((s, i) => (
                  <div className="al-slide" key={i}>
                    <div className="al-slide-icon" style={{ background: s.bg, border: `1px solid ${s.border}` }}>{s.icon}</div>
                    <div className="al-slide-title">{s.title}</div>
                    <div className="al-slide-desc">{s.desc}</div>
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {[
                  { icon: <Users className="w-4 h-4" style={{ color: '#3b6ef8' }} />, bg: 'rgba(59,110,248,0.1)', border: 'rgba(59,110,248,0.2)', title: 'Employee Directory', desc: 'Centralized workforce database management' },
                  { icon: <BarChart3 className="w-4 h-4" style={{ color: '#059669' }} />, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', title: 'Analytics Suite', desc: 'Real-time insights & advanced reporting' },
                  { icon: <FileText className="w-4 h-4" style={{ color: '#7c3bf8' }} />, bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', title: 'Payroll Engine', desc: 'Automated processing & compliance' },
                  { icon: <Settings className="w-4 h-4" style={{ color: '#d97706' }} />, bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', title: 'System Config', desc: 'Customizable policies & workflows' },
                  { icon: <Shield className="w-4 h-4" style={{ color: '#dc2626' }} />, bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', title: 'Access Control', desc: 'Role-based permissions & audit logs' },
                  { icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} />, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', title: 'Compliance', desc: 'Regulatory reporting & documentation' },
                ].map((s, i) => (
                  <div className="al-slide" key={`dup-${i}`}>
                    <div className="al-slide-icon" style={{ background: s.bg, border: `1px solid ${s.border}` }}>{s.icon}</div>
                    <div className="al-slide-title">{s.title}</div>
                    <div className="al-slide-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Stats row ── */}
            <div className="al-stats">
              <div className="al-stat">
                <div className="al-stat-num" style={{ color: '#3b6ef8' }}>Live</div>
                <div className="al-stat-label">Attendance</div>
              </div>
              <div className="al-stat">
                <div className="al-stat-num" style={{ color: '#059669' }}>24/7</div>
                <div className="al-stat-label">Monitored</div>
              </div>
              <div className="al-stat">
                <div className="al-stat-num" style={{ color: '#7c3bf8' }}>L4</div>
                <div className="al-stat-label">ACCESS LEVEL</div>
              </div>
            </div>

            {/* ── Scrolling ticker ── */}
            <div className="al-ticker">
              <div className="al-ticker-track">
                {[
                  { label: 'Real-Time Attendance Sync', color: '#3b6ef8' },
                  { label: 'Biometric Integration', color: '#059669' },
                  { label: 'Multi-Site Management', color: '#7c3bf8' },
                  { label: 'Payroll Automation', color: '#d97706' },
                  { label: 'Compliance Reporting', color: '#dc2626' },
                  { label: 'Role-Based Access', color: '#059669' },
                  { label: 'Audit Trail Logging', color: '#3b6ef8' },
                  { label: 'Leave Management', color: '#059669' },
                  // duplicate for seamless loop
                  { label: 'Real-Time Attendance Sync', color: '#3b6ef8' },
                  { label: 'Biometric Integration', color: '#059669' },
                  { label: 'Multi-Site Management', color: '#7c3bf8' },
                  { label: 'Payroll Automation', color: '#d97706' },
                  { label: 'Compliance Reporting', color: '#dc2626' },
                  { label: 'Role-Based Access', color: '#059669' },
                  { label: 'Audit Trail Logging', color: '#3b6ef8' },
                  { label: 'Leave Management', color: '#059669' },
                ].map((t, i) => (
                  <span className="al-ticker-item" key={i}>
                    <span className="al-ticker-dot" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }}></span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="al-alert">
              <AlertCircle className="w-4 h-4" style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="al-alert-title">Restricted Access Portal</div>
                <div className="al-alert-desc">Restricted to authorized administrators only. All access attempts are monitored and logged for security compliance.</div>
              </div>
            </div>
          </div>

          <div className="al-footer">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#059669', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="al-right">
          <div className="al-mobile-brand">
            <div className="al-brand-icon">
              <Shield className="w-5 h-5" style={{ color: '#3b6ef8' }} />
            </div>
            <div>
              <div className="al-brand-name">TimeTrack Pro</div>
              <div className="al-brand-sub">Administration Portal</div>
            </div>
          </div>

          <div className="al-form-header">
            <div className="al-icon-wrap">
              <Lock className="w-7 h-7" style={{ color: '#3b6ef8' }} />
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
            <CheckCircle2 className="w-3 h-3" style={{ color: '#059669' }} />
            Secure · Encrypted · Monitored
          </div>
        </div>
      </div>
    </>
  );
}
