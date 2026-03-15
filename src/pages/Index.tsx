import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { 
  Loader2, 
  ArrowRight,
  Shield,
  Users,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Database,
  FileText,
  MapPin,
  CalendarCheck,
  UserCog,
  Keyboard,
} from 'lucide-react';
import adminPortalIcon from '@/assets/Frontadmin.png';
import saoPortalIcon from '@/assets/FrontSite.png';
import employeePortalIcon from '@/assets/FrontEmployeet.png';
import encoderPortalIcon from '@/assets/encoder-portal-icon.png';

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);
  const TOTAL = 4;

  const goTo = useCallback((idx) => {
    setActiveIndex(Math.max(0, Math.min(TOTAL - 1, idx)));
  }, []);

  const onTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = startXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setActiveIndex(prev => Math.max(0, Math.min(TOTAL - 1, prev + (diff > 0 ? 1 : -1))));
    }
  }, []);

  const onMouseDown = useCallback((e) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
  }, []);

  const onMouseUp = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = startXRef.current - e.clientX;
    if (Math.abs(diff) > 40) {
      setActiveIndex(prev => Math.max(0, Math.min(TOTAL - 1, prev + (diff > 0 ? 1 : -1))));
    }
  }, []);

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'employee') navigate('/employee');
      else if (role === 'site_admin_officer') navigate('/sao');
      else if (role === 'encoder') navigate('/encoder');
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 32, height: 32, color: '#f97316', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 11, color: '#c2410c', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Establishing secure session...
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      role: 'System Administrator',
      level: 'L4 ACCESS',
      levelBg: 'rgba(239,68,68,0.10)', levelBorder: 'rgba(239,68,68,0.30)', levelText: '#dc2626',
      accent: '#f97316', accentDim: 'rgba(249,115,22,0.10)', accentBorder: 'rgba(249,115,22,0.35)',
      accentText: '#c2410c',
      image: adminPortalIcon, imageAlt: 'Administrator',
      label: 'TMC System Control',
      labelIcon: <Shield size={15} color="#ea580c" />,
      headerIcon: <Shield size={15} color="#ea580c" />,
      description: 'Enterprise-wide governance, security policy enforcement, and organizational oversight',
      features: [
        { icon: <UserCog size={13} color="#ea580c" />, title: 'User & Permission Management', sub: 'Global directory administration' },
        { icon: <Database size={13} color="#ea580c" />, title: 'System Analytics Dashboard', sub: 'Real-time operational intelligence' },
        { icon: <FileText size={13} color="#ea580c" />, title: 'Compliance Reporting', sub: 'Audit-ready documentation' },
      ],
      btnFrom: '#f97316', btnTo: '#ea580c', btnShadow: 'rgba(249,115,22,0.35)',
      btnLabel: 'Access Administrator Portal',
      to: '/admin/login',
      isAdmin: true,
    },
    {
      role: 'TMC Site Admin Officer',
      level: 'L3 ACCESS',
      levelBg: 'rgba(249,115,22,0.10)', levelBorder: 'rgba(249,115,22,0.35)', levelText: '#ea580c',
      accent: '#ea580c', accentDim: 'rgba(234,88,12,0.10)', accentBorder: 'rgba(234,88,12,0.35)',
      accentText: '#c2410c',
      image: saoPortalIcon, imageAlt: 'Site Operations',
      label: 'TMC Site Operations Hub',
      labelIcon: <MapPin size={15} color="#f97316" />,
      headerIcon: <MapPin size={15} color="#f97316" />,
      description: 'Multi-site management, workforce coordination, and field compliance oversight',
      features: [
        { icon: <MapPin size={13} color="#f97316" />, title: 'Multi-Site Dashboard', sub: 'Real-time location monitoring' },
        { icon: <Users size={13} color="#f97316" />, title: 'Workforce Allocation', sub: 'Resource optimization tools' },
        { icon: <CalendarCheck size={13} color="#f97316" />, title: 'Compliance Auditing', sub: 'Field operation verification' },
      ],
      btnFrom: '#ea580c', btnTo: '#c2410c', btnShadow: 'rgba(234,88,12,0.35)',
      btnLabel: 'Access Site Operations Portal',
      to: '/sao/login',
      isAdmin: false,
    },
    {
      role: 'Employee Self-Service',
      level: 'L2 ACCESS',
      levelBg: 'rgba(251,146,60,0.10)', levelBorder: 'rgba(251,146,60,0.35)', levelText: '#ea580c',
      accent: '#fb923c', accentDim: 'rgba(251,146,60,0.10)', accentBorder: 'rgba(251,146,60,0.35)',
      accentText: '#c2410c',
      image: employeePortalIcon, imageAlt: 'Employee',
      label: 'TMC Personal Workspace',
      labelIcon: <UserCheck size={15} color="#fb923c" />,
      headerIcon: <UserCheck size={15} color="#fb923c" />,
      description: 'Attendance management, leave requests, and personal records access',
      features: [
        { icon: <CalendarCheck size={13} color="#fb923c" />, title: 'Attendance Tracking', sub: 'Biometric & mobile check-in' },
        { icon: <FileText size={13} color="#fb923c" />, title: 'Leave Management', sub: 'Digital request workflow' },
        { icon: <Database size={13} color="#fb923c" />, title: 'Personal Document Vault', sub: 'Secure record storage' },
      ],
      btnFrom: '#fb923c', btnTo: '#f97316', btnShadow: 'rgba(251,146,60,0.35)',
      btnLabel: 'Access Employee Portal',
      to: '/employee/login',
      isAdmin: false,
    },
    {
      role: 'Encoder',
      level: 'L1 ACCESS',
      levelBg: 'rgba(139,92,246,0.10)', levelBorder: 'rgba(139,92,246,0.30)', levelText: '#7c3aed',
      accent: '#8b5cf6', accentDim: 'rgba(139,92,246,0.10)', accentBorder: 'rgba(139,92,246,0.35)',
      accentText: '#6d28d9',
      image: encoderPortalIcon, imageAlt: 'Encoder',
      label: 'TMC Data Entry Hub',
      labelIcon: <Keyboard size={15} color="#8b5cf6" />,
      headerIcon: <Keyboard size={15} color="#8b5cf6" />,
      description: 'Data entry for workers & employees, record management, and encoding operations',
      features: [
        { icon: <Keyboard size={13} color="#8b5cf6" />, title: 'Worker Data Entry', sub: 'Streamlined record encoding' },
        { icon: <FileText size={13} color="#8b5cf6" />, title: 'Employee Records', sub: 'Accurate data management' },
        { icon: <Database size={13} color="#8b5cf6" />, title: 'Data Validation', sub: 'Quality assurance tools' },
      ],
      btnFrom: '#8b5cf6', btnTo: '#7c3aed', btnShadow: 'rgba(139,92,246,0.35)',
      btnLabel: 'Access Encoder Portal',
      to: '/encoder/login',
      isAdmin: false,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes orb-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1) translateZ(0); }
          50%       { opacity: 0.28; transform: scale(1.07) translateZ(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translate3d(0, 20px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes slide-in-bottom {
          from { opacity: 0; transform: translate3d(0, 30px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ── ROOT ── */
        .pr-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #fff7ed;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          isolation: isolate;
        }

        /* ── BG ── */
        .pr-bg {
          position: fixed;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=55');
          background-size: cover;
          background-position: center;
          transform: translateZ(0);
          z-index: -3;
        }
        .pr-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(255,252,248,0.97) 0%,
            rgba(255,248,240,0.97) 50%,
            rgba(255,244,232,0.97) 100%
          );
        }

        /* ── GRID ─ */
        .pr-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(249,115,22,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.07) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
          z-index: -2;
        }

        /* ── ORBS ── */
        .pr-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
          transform: translateZ(0);
          animation: orb-pulse 11s ease-in-out infinite;
        }
        .pr-orb-1 {
          width: 480px; height: 480px;
          background: radial-gradient(circle at center, rgba(249,115,22,0.22), transparent 68%);
          top: -180px; left: -180px;
        }
        .pr-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle at center, rgba(234,88,12,0.18), transparent 68%);
          bottom: -130px; right: -130px;
          animation-delay: -5.5s;
        }

        /* ── CONTENT ─ */
        .pr-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ── HERO ─ */
        .pr-hero {
          text-align: center;
          padding: 44px 20px 0;
          animation: fade-up 0.55s ease both;
        }
        .pr-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 50px;
          background: rgba(249,115,22,0.10);
          border: 1px solid rgba(249,115,22,0.35);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.11em;
          color: #c2410c;
          margin-bottom: 16px;
        }
        .pr-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f97316;
          flex-shrink: 0;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .pr-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(24px, 5.5vw, 46px);
          font-weight: 800;
          color: #111111;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .pr-title-accent {
          background: linear-gradient(90deg, #f97316, #ea580c, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }
        .pr-subtitle {
          font-size: 13.5px;
          color: #444444;
          max-width: 400px;
          margin: 10px auto 0;
          line-height: 1.65;
          font-weight: 400;
        }

        /* ── CAROUSEL WRAPPER ── */
        .pr-carousel-wrap {
          padding: 32px 0 0;
          animation: fade-up 0.55s 0.12s ease both;
        }

        .pr-viewport {
          width: 100%;
          overflow: hidden;
          touch-action: pan-y;
          cursor: grab;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-viewport:active { cursor: grabbing; }

        .pr-track {
          display: flex;
          will-change: transform;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .pr-slide {
          flex: 0 0 100%;
          display: flex;
          justify-content: center;
          padding: 0 18px 6px;
        }

        /* ── DESKTOP: 4-col grid (UNCHANGED) ── */
        @media (min-width: 1024px) {
          .pr-hero { padding-top: 56px; }
          .pr-viewport { overflow: visible; cursor: default !important; }
          .pr-track {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            max-width: 1280px;
            margin: 0 auto;
            transform: none !important;
            transition: none !important;
          }
          .pr-slide { padding: 0 0 6px; }
          .pr-nav,
          .pr-swipe-hint { display: none !important; }
        }

        @media (min-width: 600px) and (max-width: 1023px) {
          .pr-slide { padding: 0 40px 6px; }
        }

        /* ── CARD  */
        .pr-card {
          width: 100%;
          max-width: 430px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(249,115,22,0.20);
          background: rgba(255,255,255,0.88);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          transform: translateZ(0);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          box-shadow: 0 4px 20px rgba(249,115,22,0.08);
        }
        .pr-card::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(249,115,22,0.45), transparent);
          flex-shrink: 0;
        }
        .pr-card:hover {
          border-color: rgba(249,115,22,0.50);
          box-shadow: 0 22px 48px rgba(249,115,22,0.14), 0 0 0 1px rgba(249,115,22,0.12);
          transform: translateY(-5px) translateZ(0);
        }

        /* Card header */
        .pr-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 17px;
          border-bottom: 1px solid rgba(249,115,22,0.14);
        }
        .pr-card-head-left { display: flex; align-items: center; gap: 10px; }
        .pr-head-icon { padding: 7px; border-radius: 9px; }
        .pr-role-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }
        .pr-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.09em;
          padding: 3px 9px;
          border-radius: 50px;
        }

        /* Card image */
        .pr-img-wrap {
          position: relative;
          width: 100%;
          height: 210px;
          overflow: hidden;
          border-bottom: 1px solid rgba(249,115,22,0.12);
          flex-shrink: 0;
        }
        @media (min-width: 600px) { .pr-img-wrap { height: 250px; } }
        @media (min-width: 1024px) { .pr-img-wrap { height: 200px; } }

        .pr-img-wrap img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center top;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          transform: translateZ(0);
          transition: transform 0.55s ease;
          display: block;
        }
        .pr-card:hover .pr-img-wrap img { transform: scale(1.04) translateZ(0); }

        .pr-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(255,247,237,0.75) 0%, rgba(255,247,237,0.10) 52%, transparent 100%);
        }
        .pr-img-label {
          position: absolute;
          bottom: 11px; left: 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 50px;
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(249,115,22,0.35);
          font-size: 12.5px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          color: #111111;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(249,115,22,0.12);
        }

        /* Card body */
        .pr-body {
          padding: 16px 16px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
          background: rgba(255,255,255,0.60);
        }
        .pr-desc {
          font-size: 12px;
          color: #444444;
          text-align: center;
          margin-bottom: 14px;
          line-height: 1.65;
          font-weight: 400;
        }

        /* Features */
        .pr-features { flex: 1; margin-bottom: 14px; display: flex; flex-direction: column; gap: 7px; }
        .pr-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 10px;
          border: 1px solid rgba(249,115,22,0.18);
          background: rgba(249,115,22,0.04);
          transition: background 0.2s, border-color 0.2s;
        }
        .pr-card:hover .pr-feature {
          background: rgba(249,115,22,0.08);
          border-color: rgba(249,115,22,0.30);
        }
        .pr-feat-icon { padding: 7px; border-radius: 8px; flex-shrink: 0; }
        .pr-feat-title { font-size: 12px; font-weight: 600; color: #111111; line-height: 1.3; }
        .pr-feat-sub   { font-size: 10.5px; color: #666666; margin-top: 2px; }

        /* CTA Button */
        .pr-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 44px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.025em;
          color: #fff;
          text-decoration: none;
          border: none;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.22s ease, transform 0.18s ease;
          transform: translateZ(0);
        }
        .pr-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 55%);
          opacity: 0;
          transition: opacity 0.22s;
        }
        .pr-btn:hover::before { opacity: 1; }
        .pr-btn:hover { transform: translateY(-1px) translateZ(0); }

        /* ── NAVIGATION ── */
        .pr-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 20px 0 6px;
        }
        .pr-nav-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(249,115,22,0.35);
          background: rgba(249,115,22,0.08);
          color: #ea580c;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-nav-btn:hover {
          background: rgba(249,115,22,0.18);
          border-color: rgba(249,115,22,0.60);
          box-shadow: 0 0 12px rgba(249,115,22,0.22);
        }
        .pr-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        .pr-dots { display: flex; gap: 7px; align-items: center; }
        .pr-dot-item {
          height: 5px;
          border-radius: 50px;
          background: rgba(249,115,22,0.25);
          cursor: pointer;
          transition: width 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
        }
        .pr-dot-item.on {
          width: 22px;
          background: #f97316;
          box-shadow: 0 0 8px rgba(249,115,22,0.40);
        }
        .pr-dot-item:not(.on) { width: 5px; }

        /* Swipe hint */
        .pr-swipe-hint {
          text-align: center;
          font-size: 9.5px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(234,88,12,0.55);
          padding: 6px 0 4px;
        }

        /* Footer */
        .pr-footer {
          text-align: center;
          padding: 26px 20px 34px;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #888888;
          animation: fade-up 0.55s 0.22s ease both;
        }

        /* ═══════════════════════════════════════════════════════════ */
        /* 📱 MOBILE APP GLASSMORPHISM UI - ONLY APPLIES BELOW 1024px */
        /* ═══════════════════════════════════════════════════════════ */
        @media (max-width: 1023px) {
          /* Creative Gradient Background */
          .pr-root {
            background: linear-gradient(180deg, 
              #fef3e8 0%, 
              #ffe8d4 25%, 
              #ffd4b8 50%, 
              #ffc4a8 75%, 
              #ffb89a 100%);
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
            position: relative;
          }

          /* Soft mesh gradient overlay */
          .pr-root::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 15% 20%, rgba(249,115,22,0.12) 0%, transparent 45%),
              radial-gradient(circle at 85% 35%, rgba(234,88,12,0.1) 0%, transparent 45%),
              radial-gradient(circle at 50% 75%, rgba(251,146,60,0.08) 0%, transparent 50%),
              radial-gradient(circle at 25% 85%, rgba(139,92,246,0.06) 0%, transparent 40%);
            pointer-events: none;
            z-index: 0;
          }

          /* Floating decorative orbs */
          .pr-root::after {
            content: '';
            position: fixed;
            width: 280px;
            height: 280px;
            background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%);
            border-radius: 50%;
            top: -80px;
            right: -80px;
            animation: float 7s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
          }

          /* Additional floating orb */
          .pr-orb-mobile-1 {
            position: fixed;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
            border-radius: 50%;
            bottom: -60px;
            left: -60px;
            animation: float 8s ease-in-out infinite reverse;
            pointer-events: none;
            z-index: 0;
          }

          /* Mobile app header - Clean Glassmorphism */
          .pr-hero {
            padding: 28px 20px 24px;
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.5);
            position: sticky;
            top: env(safe-area-inset-top);
            z-index: 10;
            box-shadow: 0 4px 24px rgba(249,115,22,0.08);
          }

          /* Logo Container - Mobile Only */
          .pr-logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 18px;
            padding: 0 10px;
          }

          .pr-logo {
            max-width: 200px;
            height: auto;
            object-fit: contain;
            filter: drop-shadow(0 3px 10px rgba(249,115,22,0.25));
          }

          /* Hide badge on mobile */
          .pr-badge {
            display: none !important;
          }

          .pr-title {
            font-size: 32px;
            line-height: 1.15;
            margin-bottom: 8px;
            color: #1a1a1a;
            text-shadow: 0 1px 2px rgba(0,0,0,0.05);
            font-weight: 800;
          }

          .pr-title-accent {
            display: block;
            font-size: 26px;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #fb923c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-top: 4px;
          }

          .pr-subtitle {
            font-size: 13.5px;
            max-width: 100%;
            margin: 10px 0 0;
            color: #666;
            line-height: 1.6;
            font-weight: 400;
          }

          .pr-carousel-wrap {
            padding: 24px 0 0;
            flex: 1;
            position: relative;
            z-index: 1;
          }

          .pr-viewport {
            padding: 0;
            overflow: visible;
            cursor: default;
          }

          .pr-track {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 0 20px 24px;
            transform: none !important;
            transition: none !important;
          }

          .pr-slide {
            flex: 0 0 auto;
            padding: 0;
            animation: slide-in-bottom 0.5s ease both;
          }

          .pr-slide:nth-child(1) { animation-delay: 0.1s; }
          .pr-slide:nth-child(2) { animation-delay: 0.2s; }
          .pr-slide:nth-child(3) { animation-delay: 0.3s; }
          .pr-slide:nth-child(4) { animation-delay: 0.4s; }

          /* Clean Card Container */
          .pr-card {
            max-width: 100%;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.6);
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 
              0 8px 32px rgba(249,115,22,0.1),
              0 2px 8px rgba(0, 0, 0, 0.04);
            overflow: visible;
            transform: none !important;
            transition: box-shadow 0.3s ease, transform 0.3s ease;
          }

          .pr-card::before { display: none; }

          .pr-card:active {
            transform: scale(0.99);
            box-shadow: 
              0 4px 20px rgba(249,115,22,0.12),
              0 1px 4px rgba(0, 0, 0, 0.05);
          }

          /* Hide header on mobile */
          .pr-card-head {
            display: none !important;
          }

          /* Hide Image, Description, and Features on Mobile */
          .pr-img-wrap,
          .pr-desc,
          .pr-features {
            display: none !important;
          }

          .pr-body {
            padding: 4px;
            background: transparent;
          }

          /* Portal Buttons - Individual Colors */
          .pr-btn {
            height: 68px;
            border-radius: 18px;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.01em;
            padding: 0 24px;
            justify-content: flex-start;
            gap: 18px;
            border: none;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
            color: #fff;
            text-shadow: 0 1px 2px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
          }

          /* Administrator Portal - Orange Gradient */
          .pr-slide:nth-child(1) .pr-btn {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            box-shadow: 0 8px 28px rgba(249,115,22,0.35);
          }

          /* Site Operations Portal - Deep Orange Gradient */
          .pr-slide:nth-child(2) .pr-btn {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            box-shadow: 0 8px 28px rgba(234,88,12,0.35);
          }

          /* Employee Portal - Light Orange Gradient */
          .pr-slide:nth-child(3) .pr-btn {
            background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
            box-shadow: 0 8px 28px rgba(251,146,60,0.35);
          }

          /* Encoder Portal - Purple Gradient */
          .pr-slide:nth-child(4) .pr-btn {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            box-shadow: 0 8px 28px rgba(139,92,246,0.35);
          }

          .pr-btn::before {
            background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%);
            opacity: 1;
          }

          .pr-btn::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
            pointer-events: none;
            border-radius: 18px;
          }

          .pr-btn:active {
            transform: scale(0.98) !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          }

          .pr-btn svg {
            transition: transform 0.2s ease;
            flex-shrink: 0;
          }

          .pr-btn:active svg:last-child {
            transform: translateX(4px);
          }

          /* Icon container in button - MORE VISIBLE */
          .pr-btn-icon {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.35);
            border: 2px solid rgba(255, 255, 255, 0.5);
            box-shadow: 
              0 4px 16px rgba(0,0,0,0.15),
              inset 0 2px 4px rgba(255,255,255,0.3);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }

          /* Make icons larger and more visible */
          .pr-btn-icon svg {
            width: 26px;
            height: 26px;
            stroke-width: 2.5;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
          }

          .pr-btn-text {
            flex: 1;
            text-align: left;
            font-weight: 700;
            font-size: 15.5px;
            letter-spacing: 0.01em;
          }

          .pr-btn-arrow {
            margin-left: auto;
            opacity: 0.95;
            width: 22px;
            height: 22px;
            stroke-width: 2.5;
          }

          .pr-nav,
          .pr-swipe-hint {
            display: none !important;
          }

          /* Clean Footer */
          .pr-footer {
            padding: 24px 20px 32px;
            font-size: 10.5px;
            color: #888;
            line-height: 1.6;
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.5);
            position: relative;
            z-index: 1;
            text-align: center;
            letter-spacing: 0.08em;
          }

          .pr-card, .pr-btn {
            -webkit-tap-highlight-color: rgba(249,115,22,0.15);
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }

          /* Smooth scrolling */
          .pr-track {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>

      <div className="pr-root">
        <div className="pr-bg" aria-hidden="true" />
        <div className="pr-grid" aria-hidden="true" />
        <div className="pr-orb pr-orb-1" aria-hidden="true" />
        <div className="pr-orb pr-orb-2" aria-hidden="true" />
        <div className="pr-orb-mobile-1" aria-hidden="true" />

        <div className="pr-content">

          {/* Hero - Greeting Section */}
          <div className="pr-hero">
            {/* Logo - Mobile Only */}
            <div className="pr-logo-container">
              <img src="/TMClog0s.png" alt="TMC Logo" className="pr-logo" />
            </div>
            
            <div className="pr-badge">
              <span className="pr-dot" />
              WELCOME TO TMC PORTAL
            </div>
            <h2 className="pr-title">
              Good day!
              <span className="pr-title-accent">Select your portal</span>
            </h2>
            <p className="pr-subtitle">
              Choose your access level to continue to your workspace
            </p>
          </div>

          {/* Portal Buttons List */}
          <div className="pr-carousel-wrap">
            <div
              className="pr-viewport"
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="pr-track"
                style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
              >
                {cards.map((c, i) => (
                  <div className="pr-slide" key={i}>
                    <div className="pr-card">

                      {/* Header - Hidden on Mobile */}
                      <div className="pr-card-head" style={{ background: `linear-gradient(135deg, ${c.accentDim}, rgba(255,255,255,0))` }}>
                        <div className="pr-card-head-left">
                          <div className="pr-head-icon" style={{ background: c.accentDim, border: `1px solid ${c.accentBorder}` }}>
                            {c.headerIcon}
                          </div>
                          <span className="pr-role-label" style={{ color: c.accentText }}>{c.role}</span>
                        </div>
                        <span className="pr-badge-pill" style={{ background: c.levelBg, border: `1px solid ${c.levelBorder}`, color: c.levelText }}>
                          {c.isAdmin ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                          {c.level}
                        </span>
                      </div>

                      {/* Image - Hidden on Mobile */}
                      <div className="pr-img-wrap">
                        <img src={c.image} alt={c.imageAlt} loading="lazy" />
                        <div className="pr-img-overlay" />
                        <div className="pr-img-label">
                          {c.labelIcon}
                          {c.label}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="pr-body">
                        <p className="pr-desc">{c.description}</p>

                        <div className="pr-features">
                          {c.features.map((f, fi) => (
                            <div className="pr-feature" key={fi}>
                              <div className="pr-feat-icon" style={{ background: c.accentDim, border: `1px solid ${c.accentBorder}` }}>
                                {f.icon}
                              </div>
                              <div>
                                <div className="pr-feat-title">{f.title}</div>
                                <div className="pr-feat-sub">{f.sub}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Link
                          to={c.to}
                          className="pr-btn"
                          style={{
                            background: `linear-gradient(135deg, ${c.btnFrom}, ${c.btnTo})`,
                            boxShadow: `0 7px 24px ${c.btnShadow}`,
                          }}
                        >
                          {/* Icon container - shown on mobile with enhanced visibility */}
                          <div className="pr-btn-icon" style={{ display: 'none', background: 'rgba(255,255,255,0.35)' }}>
                            {c.headerIcon}
                          </div>
                          <span className="pr-btn-text">{c.btnLabel}</span>
                          <ArrowRight size={18} className="pr-btn-arrow" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav controls - Hidden on Mobile */}
            <div className="pr-nav">
              <button
                className="pr-nav-btn"
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="Previous portal"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="pr-dots">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className={`pr-dot-item${activeIndex === i ? ' on' : ''}`}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>
              <button
                className="pr-nav-btn"
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex === TOTAL - 1}
                aria-label="Next portal"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <p className="pr-swipe-hint">Swipe to explore portals</p>
          </div>

          <p className="pr-footer">
            Secured by enterprise-grade encryption &nbsp;·&nbsp; All access is logged and monitored
          </p>
        </div>
      </div>
    </>
  );
}
