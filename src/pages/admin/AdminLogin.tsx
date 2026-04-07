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
    { icon: <Users    className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(249,115,22,0.75)',  border: 'rgba(249,115,22,0.90)', title: 'Employee Directory', desc: 'Centralized workforce database management' },
    { icon: <BarChart3 className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(234,88,12,0.75)',  border: 'rgba(234,88,12,0.90)',  title: 'Analytics Suite',     desc: 'Real-time insights & advanced reporting' },
    { icon: <FileText  className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(251,146,60,0.75)', border: 'rgba(251,146,60,0.90)', title: 'Payroll Engine',      desc: 'Automated processing & compliance' },
    { icon: <Settings  className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(249,115,22,0.65)', border: 'rgba(249,115,22,0.80)', title: 'System Config',      desc: 'Customizable policies & workflows' },
    { icon: <Shield    className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(234,88,12,0.75)',  border: 'rgba(234,88,12,0.90)', title: 'Access Control',     desc: 'Role-based permissions & audit logs' },
    { icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#fff' }} />, bg: 'rgba(251,146,60,0.75)', border: 'rgba(251,146,60,0.90)', title: 'Compliance',     desc: 'Regulatory reporting & documentation' },
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

        /* ── DESKTOP KEYFRAMES ── */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes carousel-slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes ticker-scroll   { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1) translateZ(0); }
          50%       { opacity: 0.28; transform: scale(1.06) translateZ(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translate3d(0, 16px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        /* ── MOBILE KEYFRAMES ── */
        @keyframes mob-sheet-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mob-hero-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mob-icon-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes mob-btn-shimmer {
          0%   { left: -120%; }
          100% { left: 200%; }
        }
        @keyframes mob-dot-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.65); }
        }

        /* ══════════════════════════════════════
           SHARED ROOT
        ══════════════════════════════════════ */
        .al-root {
          font-family: 'DM Sans', sans-serif;
          height: 100vh; width: 100vw;
          display: flex; overflow: hidden;
          position: relative; background: #fff7ed;
          isolation: isolate;
        }

        .al-bg {
          position: fixed; inset: 0; z-index: -3;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=55');
          background-size: cover; background-position: center;
          transform: translateZ(0);
        }
        .al-bg::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(160deg,rgba(255,252,248,0.97) 0%,rgba(255,248,240,0.97) 50%,rgba(255,244,232,0.97) 100%);
        }
        .al-grid {
          position: fixed; inset: 0; z-index: -2; pointer-events: none;
          background-image: linear-gradient(rgba(249,115,22,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.07) 1px,transparent 1px);
          background-size: 56px 56px;
        }
        .al-orb { position: fixed; border-radius: 50%; pointer-events: none; z-index: -1; transform: translateZ(0); animation: orb-pulse 11s ease-in-out infinite; }
        .al-orb-1 { width: 560px; height: 560px; top: -200px; left: -160px; background: radial-gradient(circle at center,rgba(249,115,22,0.22),transparent 68%); }
        .al-orb-2 { width: 440px; height: 440px; bottom: -150px; right: -110px; background: radial-gradient(circle at center,rgba(251,146,60,0.18),transparent 68%); animation-delay: -5.5s; }

        /* ══════════════════════════════════════
           DESKTOP LEFT PANEL — 100% UNCHANGED
        ══════════════════════════════════════ */
        .al-left { position: relative; z-index: 10; width: 55%; height: 100vh; display: none; flex-direction: column; justify-content: space-between; padding: 36px 44px; border-right: 1px solid rgba(249,115,22,0.18); background: rgba(255,252,248,0.90); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); overflow-y: auto; animation: fade-up 0.55s ease both; }
        @media (min-width: 1024px) { .al-left { display: flex; } }
        .al-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
        .al-brand-icon { width: 42px; height: 42px; border-radius: 11px; background: rgba(249,115,22,0.60); border: 1px solid rgba(249,115,22,0.80); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(249,115,22,0.30); }
        .al-brand-name { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #111111; }
        .al-brand-sub  { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: #f97316; margin-top: 2px; opacity: 1; }
        .al-headline { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: #111111; line-height: 1.22; margin-bottom: 8px; }
        .al-headline span { background: linear-gradient(90deg,#f97316,#ea580c,#fb923c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .al-desc { font-size: 13px; font-weight: 400; color: #222222; line-height: 1.65; margin-bottom: 24px; opacity: 1; }
        .al-carousel { position: relative; width: 100%; overflow: hidden; margin-bottom: 22px; }
        .al-carousel-track { display: flex; gap: 13px; animation: carousel-slide 18s linear infinite; width: max-content; }
        .al-carousel:hover .al-carousel-track { animation-play-state: paused; }
        .al-carousel::before,.al-carousel::after { content: ''; position: absolute; top: 0; bottom: 0; width: 55px; z-index: 2; pointer-events: none; }
        .al-carousel::before { left: 0; background: linear-gradient(to right,rgba(255,247,237,0.95),transparent); }
        .al-carousel::after  { right: 0; background: linear-gradient(to left,rgba(255,247,237,0.95),transparent); }
        .al-slide { flex-shrink: 0; width: 192px; padding: 15px; border-radius: 13px; background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.55); display: flex; flex-direction: column; gap: 9px; box-shadow: 0 2px 12px rgba(249,115,22,0.15); transition: border-color 0.2s,background 0.2s,box-shadow 0.2s; }
        .al-slide:hover { border-color: rgba(249,115,22,0.80); background: rgba(255,255,255,0.98); box-shadow: 0 4px 20px rgba(249,115,22,0.25); }
        .al-slide-icon  { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .al-slide-title { font-size: 12.5px; font-weight: 600; color: #111111; }
        .al-slide-desc  { font-size: 11px; color: #333333; line-height: 1.45; opacity: 1; }
        .al-stats { display: flex; gap: 10px; margin-bottom: 20px; }
        .al-stat { flex: 1; padding: 11px 12px; border-radius: 11px; text-align: center; background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.55); box-shadow: 0 2px 12px rgba(249,115,22,0.15); }
        .al-stat-num   { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 700; line-height: 1; }
        .al-stat-label { font-size: 9.5px; color: #222222; margin-top: 4px; letter-spacing: 0.07em; text-transform: uppercase; opacity: 1; }
        .al-ticker { overflow: hidden; padding: 8px 0; margin-bottom: 18px; border-top: 1px solid rgba(249,115,22,0.55); border-bottom: 1px solid rgba(249,115,22,0.55); position: relative; }
        .al-ticker::before,.al-ticker::after { content: ''; position: absolute; top: 0; bottom: 0; width: 36px; z-index: 2; pointer-events: none; }
        .al-ticker::before { left: 0; background: linear-gradient(to right,rgba(255,247,237,0.95),transparent); }
        .al-ticker::after  { right: 0; background: linear-gradient(to left,rgba(255,247,237,0.95),transparent); }
        .al-ticker-track { display: flex; animation: ticker-scroll 22s linear infinite; width: max-content; }
        .al-ticker:hover .al-ticker-track { animation-play-state: paused; }
        .al-ticker-item { display: inline-flex; align-items: center; gap: 6px; padding: 0 18px; font-size: 11px; font-weight: 500; color: #222222; white-space: nowrap; opacity: 1; }
        .al-ticker-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .al-alert { display: flex; align-items: flex-start; gap: 10px; padding: 13px; border-radius: 11px; background: rgba(254,226,226,0.5); border: 1px solid rgba(239,68,68,0.2); }
        .al-alert-title { font-size: 12px; font-weight: 600; color: #dc2626; margin-bottom: 3px; }
        .al-alert-desc  { font-size: 11px; color: #222222; line-height: 1.5; opacity: 1; }
        .al-footer { display: flex; align-items: center; gap: 7px; padding-top: 16px; margin-top: 16px; border-top: 1px solid rgba(249,115,22,0.40); font-size: 11px; color: #222222; opacity: 1; }

        /* ══════════════════════════════════════
           DESKTOP RIGHT PANEL — 100% UNCHANGED
        ══════════════════════════════════════ */
        .al-right { position: relative; z-index: 10; flex: 1; height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 36px 40px; overflow-y: auto; background: rgba(255,255,255,0.88); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-left: 1px solid rgba(249,115,22,0.14); animation: fade-up 0.55s 0.08s ease both; }
        .al-mobile-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; justify-content: center; }
        @media (min-width: 1024px) { .al-mobile-brand { display: none; } }
        .al-form-header { text-align: center; margin-bottom: 26px; }
        .al-icon-wrap { width: 62px; height: 62px; border-radius: 16px; background: linear-gradient(135deg,rgba(249,115,22,0.14),rgba(234,88,12,0.08)); border: 1px solid rgba(249,115,22,0.28); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; box-shadow: 0 4px 24px rgba(249,115,22,0.18); }
        .al-title    { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: #111111; margin-bottom: 5px; }
        .al-subtitle { font-size: 13px; color: #333333; font-weight: 400; opacity: 1; }
        .al-field { margin-bottom: 14px; }
        .al-label { display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: #111111; margin-bottom: 6px; opacity: 1; }
        .al-input-wrap { position: relative; }
        .al-input-wrap svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: rgba(249,115,22,0.55); pointer-events: none; }
        .al-input { width: 100%; height: 46px; padding: 0 14px 0 38px; background: rgba(255,255,255,0.90); border: 1px solid rgba(249,115,22,0.35); border-radius: 10px; color: #111111; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s ease; box-shadow: 0 1px 4px rgba(249,115,22,0.07); }
        .al-input::placeholder { color: rgba(0,0,0,0.35); }
        .al-input:focus { background: #fff; border-color: rgba(249,115,22,0.55); box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
        .al-btn { width: 100%; height: 47px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(135deg,#f97316,#ea580c); color: #fff; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px; transition: box-shadow 0.25s ease,transform 0.2s ease; box-shadow: 0 6px 26px rgba(249,115,22,0.35); position: relative; overflow: hidden; transform: translateZ(0); }
        .al-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(255,255,255,0.16),transparent); opacity: 0; transition: opacity 0.25s; }
        .al-btn:hover { transform: translateY(-1px) translateZ(0); box-shadow: 0 10px 34px rgba(249,115,22,0.48); }
        .al-btn:hover::after { opacity: 1; }
        .al-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .al-divider { position: relative; margin: 20px 0; text-align: center; }
        .al-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(249,115,22,0.15); }
        .al-divider span { position: relative; padding: 0 12px; font-size: 10px; color: #444444; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255,255,255,0.88); }
        .al-emp-link { text-align: center; font-size: 13px; color: #222222; margin-bottom: 12px; opacity: 1; }
        .al-emp-link a { color: #f97316; font-weight: 600; text-decoration: none; }
        .al-emp-link a:hover { color: #ea580c; text-decoration: underline; }
        .al-back { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #222222; text-decoration: none; padding: 8px 16px; border-radius: 9px; width: fit-content; margin: 0 auto; border: 1px solid rgba(249,115,22,0.25); background: rgba(249,115,22,0.07); transition: all 0.2s ease; opacity: 1; }
        .al-back:hover { color: #ea580c; background: rgba(249,115,22,0.14); border-color: rgba(249,115,22,0.4); }
        .al-secure { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 14px auto 0; padding: 4px 14px; border-radius: 50px; width: fit-content; background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.20); font-size: 11px; color: #c2410c; font-weight: 700; }

        /* ═══════════════════════════════════════════════════════════════
           ███  MOBILE  ≤ 1023px  —  NO SCROLL. FITS 100vh EXACTLY.
        ═══════════════════════════════════════════════════════════════ */
        @media (max-width: 1023px) {

          /* Kill ALL desktop layers */
          .al-bg, .al-grid, .al-orb-1, .al-orb-2 { display: none !important; }

          /* ── Root: locked to viewport, no overflow ── */
          .al-root {
            background: #f97316;
            width: 100vw;
            height: 100vh;
            height: 100dvh; /* dynamic viewport — respects browser chrome */
            overflow: hidden;
            align-items: stretch;
            display: flex;
            flex-direction: column;
          }

          /* Right panel fills root, no scroll */
          .al-right {
            width: 100%;
            height: 100%;
            flex: 1;
            overflow: hidden;
            justify-content: flex-start;
            padding: 0;
            background: transparent;
            border-left: none;
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
            display: flex;
            flex-direction: column;
          }

          /* Hide all desktop children */
          .al-right > .al-mobile-brand,
          .al-right > .al-form-header,
          .al-right > form,
          .al-right > .al-divider,
          .al-right > .al-emp-link,
          .al-right > .al-back,
          .al-right > .al-secure { display: none !important; }

          /* ══════════════════════════════════
             STATUS BAR  — fixed height 44px
          ══════════════════════════════════ */
          .mob-status {
            flex-shrink: 0;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            padding-top: env(safe-area-inset-top, 0px);
          }
          .mob-status-time {
            font-size: 13px; font-weight: 700; color: #fff;
            font-family: 'DM Sans', sans-serif; letter-spacing: 0.02em;
          }
          .mob-status-right { display: flex; align-items: center; gap: 5px; }
          .mob-signal { display: flex; align-items: flex-end; gap: 2px; height: 11px; }
          .mob-signal span { width: 3px; border-radius: 1px; background: rgba(255,255,255,0.95); }
          .mob-signal span:nth-child(1) { height: 4px; }
          .mob-signal span:nth-child(2) { height: 7px; }
          .mob-signal span:nth-child(3) { height: 10px; }
          .mob-battery {
            width: 22px; height: 11px; border-radius: 2.5px;
            border: 1.5px solid rgba(255,255,255,0.90);
            position: relative;
          }
          .mob-battery::before {
            content: ''; position: absolute; left: 2px; top: 1.5px;
            width: 13px; height: 5px; border-radius: 1px;
            background: rgba(255,255,255,0.90);
          }
          .mob-battery::after {
            content: ''; position: absolute; right: -4px; top: 2.5px;
            width: 2.5px; height: 5px; border-radius: 0 1px 1px 0;
            background: rgba(255,255,255,0.65);
          }

          /* ══════════════════════════════════
             HERO  — compact, fixed proportion
          ══════════════════════════════════ */
          .mob-hero {
            flex-shrink: 0;
            height: 28vh;
            min-height: 190px;
            max-height: 240px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0 24px 16px;
            text-align: center;
            animation: mob-hero-in 0.45s ease both;
          }

          /* Decorative circles */
          .mob-hero::before {
            content: '';
            position: absolute; top: -60px; left: -60px;
            width: 200px; height: 200px; border-radius: 50%;
            background: rgba(255,255,255,0.12); pointer-events: none;
          }
          .mob-hero::after {
            content: '';
            position: absolute; top: -40px; right: -65px;
            width: 185px; height: 185px; border-radius: 50%;
            background: rgba(255,255,255,0.09); pointer-events: none;
          }
          .mob-hero-circle3 {
            position: absolute; bottom: -30px; left: -45px;
            width: 145px; height: 145px; border-radius: 50%;
            background: rgba(255,255,255,0.08); pointer-events: none;
          }
          .mob-hero-circle4 {
            position: absolute; bottom: -20px; right: -35px;
            width: 120px; height: 120px; border-radius: 50%;
            background: rgba(255,255,255,0.07); pointer-events: none;
          }

          /* Row: icon + app name side by side — saves vertical space */
          .mob-hero-brand-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          .mob-icon-wrap {
            width: 50px; height: 50px; border-radius: 14px;
            background: rgba(255,255,255,0.22);
            border: 2px solid rgba(255,255,255,0.50);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            animation: mob-icon-pop 0.5s 0.08s cubic-bezier(0.34,1.56,0.64,1) both;
            box-shadow: 0 6px 20px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.28);
          }
          .mob-brand-text { text-align: left; }
          .mob-app-name {
            font-family: 'Syne', sans-serif;
            font-size: 15px; font-weight: 700; color: #fff;
            line-height: 1.2; letter-spacing: 0.01em;
          }
          .mob-app-tagline {
            font-size: 10px; font-weight: 500;
            color: rgba(255,255,255,0.65);
            letter-spacing: 0.06em; text-transform: uppercase;
            margin-top: 1px;
          }

          .mob-hero-title {
            font-family: 'Syne', sans-serif;
            font-size: 26px; font-weight: 800; color: #fff;
            line-height: 1.12; margin-bottom: 6px;
            position: relative; z-index: 1;
            letter-spacing: -0.3px;
          }
          .mob-hero-sub {
            font-size: 13px; color: rgba(255,255,255,0.78);
            line-height: 1.5; max-width: 280px;
            position: relative; z-index: 1;
          }

          /* ══════════════════════════════════
             WHITE SHEET  — fills remaining space
             flex: 1 = takes everything left after hero
          ══════════════════════════════════ */
          .mob-sheet {
            flex: 1;
            background: #ffffff;
            border-radius: 26px 26px 0 0;
            display: flex;
            flex-direction: column;
            padding: 0 22px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            animation: mob-sheet-up 0.45s 0.06s cubic-bezier(0.22,1,0.36,1) both;
            box-shadow: 0 -8px 36px rgba(0,0,0,0.13);
            overflow: hidden; /* never scroll */
          }

          /* Drag handle */
          .mob-handle {
            width: 38px; height: 4px; border-radius: 2px;
            background: #e5e7eb;
            margin: 10px auto 16px;
            flex-shrink: 0;
          }

          /* Field label */
          .mob-label {
            display: block; font-size: 13px; font-weight: 700;
            color: #111827; margin-bottom: 7px;
            font-family: 'DM Sans', sans-serif;
          }

          /* Input field */
          .mob-field { flex-shrink: 0; margin-bottom: 12px; }
          .mob-input-wrap { position: relative; }
          .mob-input-icon {
            position: absolute; left: 14px; top: 50%;
            transform: translateY(-50%);
            color: #f97316;
            pointer-events: none;
            display: flex; align-items: center;
            transition: color 0.18s;
          }

          /* ── MOBILE INPUT: much more visible ── */
          .mob-input {
            width: 100%; height: 52px;
            padding: 0 44px 0 46px;
            background: #fff;
            border: 2px solid #e2e8f0;
            border-radius: 14px;
            color: #111827; font-size: 15px;
            font-family: 'DM Sans', sans-serif;
            outline: none;
            transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
            -webkit-appearance: none;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          .mob-input::placeholder { color: #b0b8c4; font-size: 13.5px; }

          /* Hover — visible orange tint */
          .mob-input:hover {
            border-color: #fdba74;
            background: #fffaf7;
            box-shadow: 0 0 0 4px rgba(249,115,22,0.08), 0 2px 8px rgba(249,115,22,0.10);
          }

          /* Focus — strong orange ring */
          .mob-input:focus {
            border-color: #f97316;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(249,115,22,0.18), 0 2px 12px rgba(249,115,22,0.20);
          }

          /* Icon turns orange on focus via sibling trick */
          .mob-input:focus ~ .mob-input-focus-indicator,
          .mob-input:focus + .mob-input-icon,
          .mob-input-wrap:focus-within .mob-input-icon {
            color: #f97316;
          }

          /* Sign In button */
          .mob-btn {
            flex-shrink: 0;
            width: 100%; height: 54px;
            border-radius: 50px; border: none; cursor: pointer;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: #fff; font-size: 16px; font-weight: 700;
            font-family: 'DM Sans', sans-serif;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            margin-top: 4px; margin-bottom: 0;
            position: relative; overflow: hidden;
            box-shadow: 0 8px 24px rgba(249,115,22,0.40);
            transition: transform 0.14s ease, box-shadow 0.16s ease;
            -webkit-tap-highlight-color: transparent;
            letter-spacing: 0.01em;
          }
          .mob-btn::before {
            content: '';
            position: absolute; top: 0; left: -120%; width: 55%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
            animation: mob-btn-shimmer 2.6s ease-in-out infinite;
          }
          .mob-btn-bubble {
            width: 38px; height: 38px; border-radius: 50%;
            background: rgba(255,255,255,0.22);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; position: relative; z-index: 1;
          }
          .mob-btn:active { transform: scale(0.97); }
          .mob-btn:disabled { opacity: 0.50; cursor: not-allowed; transform: none; }
          .mob-btn:disabled::before { display: none; }
          .mob-btn-label { position: relative; z-index: 1; }

          /* Divider */
          .mob-divider {
            flex-shrink: 0;
            display: flex; align-items: center; gap: 10px;
            margin: 14px 0 12px;
          }
          .mob-divider-line { flex: 1; height: 1px; background: #f0f0f0; }
          .mob-divider-text {
            font-size: 11.5px; color: #adb5bd; font-weight: 500;
            font-family: 'DM Sans', sans-serif;
          }

          /* Back link */
          .mob-back {
            flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; height: 50px; border-radius: 14px;
            background: #f9fafb; border: 1.5px solid #e9ecef;
            text-decoration: none; font-size: 14px; font-weight: 600;
            color: #374151; font-family: 'DM Sans', sans-serif;
            transition: background 0.15s, border-color 0.15s;
            -webkit-tap-highlight-color: transparent;
          }
          .mob-back:active { background: #f3f4f6; }

          /* Bottom row: notice + secure combined into one compact strip */
          .mob-bottom-strip {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 12px;
          }
          .mob-notice {
            display: flex; align-items: center; gap: 8px;
            padding: 9px 12px; border-radius: 11px;
            background: #fff5f5; border: 1px solid #fecaca;
          }
          .mob-notice-text {
            font-size: 11.5px; font-weight: 600; color: #dc2626;
            font-family: 'DM Sans', sans-serif;
          }
          .mob-notice-sub {
            font-size: 10.5px; color: #9ca3af;
            font-family: 'DM Sans', sans-serif;
          }
          .mob-secure {
            display: flex; align-items: center; justify-content: center;
            gap: 6px;
            font-size: 10.5px; color: #adb5bd; font-weight: 500;
            font-family: 'DM Sans', sans-serif;
            padding-bottom: 4px;
          }
          .mob-secure-sep { color: #dee2e6; }
          .mob-secure-dot {
            width: 5px; height: 5px; border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 4px rgba(34,197,94,0.65);
            animation: mob-dot-live 2s ease-in-out infinite;
            flex-shrink: 0;
          }
        }

        /* Hide mobile-only on desktop */
        @media (min-width: 1024px) {
          .mob-status,
          .mob-hero,
          .mob-sheet { display: none !important; }
        }
      `}</style>

      <div className="al-root">
        <div className="al-bg" />
        <div className="al-grid" />
        <div className="al-orb al-orb-1" />
        <div className="al-orb al-orb-2" />

        {/* ══════════════════════════════════
            LEFT PANEL — desktop, unchanged
        ══════════════════════════════════ */}
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
            <p className="al-desc">Streamline attendance tracking, payroll processing, and employee management with comprehensive administrative controls.</p>
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
            <div className="al-stats">
              <div className="al-stat"><div className="al-stat-num" style={{ color: '#f97316' }}>Live</div><div className="al-stat-label">Attendance</div></div>
              <div className="al-stat"><div className="al-stat-num" style={{ color: '#fb923c' }}>24/7</div><div className="al-stat-label">Monitored</div></div>
              <div className="al-stat"><div className="al-stat-num" style={{ color: '#ea580c' }}>L4</div><div className="al-stat-label">ACCESS LEVEL</div></div>
            </div>
            <div className="al-ticker">
              <div className="al-ticker-track">
                {[...tickerItems, ...tickerItems].map((t, i) => (
                  <span className="al-ticker-item" key={i}>
                    <span className="al-ticker-dot" style={{ background: t.color }} />
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
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#f97316', flexShrink: 0 }} />
            <span>Secure Connection Established</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>TLS 1.3 Encrypted</span>
          </div>
        </div>

        {/* ══════════════════════════════════
            RIGHT PANEL
        ══════════════════════════════════ */}
        <div className="al-right">

          {/* ████  MOBILE LAYOUT  ████ */}

          {/* Status bar */}
        
          {/* Orange hero — compact */}
          <div className="mob-hero">
            <div className="mob-hero-circle3" />
            <div className="mob-hero-circle4" />

            {/* Icon + brand name in a row to save vertical space */}
           

            <h1 className="mob-hero-title">Welcome Back</h1>
            <p className="mob-hero-sub">Sign in to access your admin dashboard and manage your workforce.</p>
          </div>

          {/* White bottom sheet — flex:1, no scroll */}
          <div className="mob-sheet">
            <div className="mob-handle" />

            {/* Email */}
            <div className="mob-field">
              <label className="mob-label" htmlFor="mob-email">Email</label>
              <div className="mob-input-wrap">
                <span className="mob-input-icon"><Mail size={17} /></span>
                <input
                  id="mob-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mob-input"
                  form="mob-form"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mob-field">
              <label className="mob-label" htmlFor="mob-password">Password</label>
              <div className="mob-input-wrap">
                <span className="mob-input-icon"><Lock size={17} /></span>
                <input
                  id="mob-password"
                  type="password"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mob-input"
                  form="mob-form"
                />
              </div>
            </div>

            {/* Form submit — id linked to inputs above */}
            <form id="mob-form" onSubmit={handleLogin} style={{ display: 'contents' }}>
              <button type="submit" className="mob-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mob-btn-bubble">
                      <Loader2 size={17} className="animate-spin" style={{ color: '#fff' }} />
                    </div>
                    <span className="mob-btn-label">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <div className="mob-btn-bubble">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                    <span className="mob-btn-label">Sign In to Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mob-divider">
              <div className="mob-divider-line" />
              <span className="mob-divider-text">or</span>
              <div className="mob-divider-line" />
            </div>

            {/* Back link */}
            <Link to="/" className="mob-back">
              Return to Portal Selection
            </Link>

            {/* Compact bottom strip: notice + secure */}
            <div className="mob-bottom-strip">
              <div className="mob-notice">
                <AlertCircle size={14} style={{ color: '#dc2626', flexShrink: 0 }} />
<div>
  <span className="mob-notice-text">Restricted Access — </span>
  <span className="mob-notice-sub">Authorized admins only. Contact IT Support to request an account.</span>
</div>
              </div>
              <div className="mob-secure">
                <span className="mob-secure-dot" />
                <span>Secure</span>
                <span className="mob-secure-sep">·</span>
                <span>TLS 1.3</span>
                <span className="mob-secure-sep">·</span>
                <span>Encrypted</span>
              </div>
            </div>
          </div>

          {/* ████  DESKTOP FORM — hidden on mobile via CSS  ████ */}
          <div className="al-mobile-brand" />

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
                <input id="email" type="email" placeholder="administrator@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="al-input" />
              </div>
            </div>
            <div className="al-field">
              <label className="al-label" htmlFor="password">Password</label>
              <div className="al-input-wrap">
                <Lock />
                <input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="al-input" />
              </div>
            </div>
            <button type="submit" className="al-btn" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : <><Shield className="w-4 h-4" /> Sign In to Administrator Portal</>}
            </button>
          </form>

          <div className="al-divider"><span>or</span></div>

          <Link to="/" className="al-back">Return to Portal Selection</Link>

          <div className="al-secure">
            <CheckCircle2 className="w-3 h-3" style={{ color: '#f97316' }} />
            Secure · Encrypted · Monitored
          </div>
        </div>
      </div>
    </>
  );
}
