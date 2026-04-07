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
      btnLabel: 'Administrator Portal',
      btnSub: 'L4 · System Control',
      to: '/admin/login',
      isAdmin: true,
      mobIcon: <Shield size={28} strokeWidth={2} color="#fff" />,
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
      btnLabel: 'Site Operations Portal',
      btnSub: 'L3 · Field Management',
      to: '/sao/login',
      isAdmin: false,
      mobIcon: <MapPin size={28} strokeWidth={2} color="#fff" />,
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
      btnLabel: 'Employee Portal',
      btnSub: 'L2 · Self Service',
      to: '/employee/login',
      isAdmin: false,
      mobIcon: <UserCheck size={28} strokeWidth={2} color="#fff" />,
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
      btnLabel: 'Encoder Portal',
      btnSub: 'L1 · Data Entry',
      to: '/encoder/login',
      isAdmin: false,
      mobIcon: <Keyboard size={28} strokeWidth={2} color="#fff" />,
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
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-18px) scale(1.04); }
}
@keyframes floatB {
  0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
  33% { transform: translateY(-12px) scale(1.03) rotate(3deg); }
  66% { transform: translateY(8px) scale(0.97) rotate(-2deg); }
}
@keyframes floatC {
  0%, 100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(12px,-14px) scale(1.06); }
}
@keyframes goo-shift {
  0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25%      { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50%      { border-radius: 50% 60% 30% 70% / 40% 50% 60% 50%; }
  75%      { border-radius: 70% 30% 50% 50% / 30% 70% 40% 60%; }
}
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(250%) skewX(-15deg); }
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(28px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes header-glow {
  0%,100% { box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 0 60px rgba(255,255,255,0.08); }
  50%      { box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 0 80px rgba(255,255,255,0.12); }
}
@keyframes gradient-x {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes spin-slow {
  to { transform: rotate(360deg); }
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
  background-image: url('https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80');
  background-size: cover;
  background-position: center;
  transform: translateZ(0);
  z-index: -3;
}
.pr-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(255,252,248,0.97) 0%, rgba(255,248,240,0.97) 50%, rgba(255,244,232,0.97) 100%);
}
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
/* ── DESKTOP: 4-col grid ── */
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
  .mob-only { display: none !important; }
}
@media (min-width: 600px) and (max-width: 1023px) {
  .pr-slide { padding: 0 40px 6px; }
}
/* ── DESKTOP CARD ── */
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
.pr-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 17px;
  border-bottom: 1px solid rgba(249,115,22,0.14);
}
.pr-card-head-left { display: flex; align-items: center; gap: 10px; }
.pr-head-icon { padding: 7px; border-radius: 9px; }
.pr-role-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; }
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
.pr-body {
  padding: 16px 16px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: rgba(255,255,255,0.60);
}
.pr-desc { font-size: 12px; color: #444444; text-align: center; margin-bottom: 14px; line-height: 1.65; font-weight: 400; }
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
.pr-card:hover .pr-feature { background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.30); }
.pr-feat-icon { padding: 7px; border-radius: 8px; flex-shrink: 0; }
.pr-feat-title { font-size: 12px; font-weight: 600; color: #111111; line-height: 1.3; }
.pr-feat-sub   { font-size: 10.5px; color: #666666; margin-top: 2px; }
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
/* Nav */
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
.pr-nav-btn:hover { background: rgba(249,115,22,0.18); border-color: rgba(249,115,22,0.60); box-shadow: 0 0 12px rgba(249,115,22,0.22); }
.pr-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.pr-dots { display: flex; gap: 7px; align-items: center; }
.pr-dot-item { height: 5px; border-radius: 50px; background: rgba(249,115,22,0.25); cursor: pointer; transition: width 0.3s ease, background 0.3s ease, box-shadow 0.3s ease; }
.pr-dot-item.on { width: 22px; background: #f97316; box-shadow: 0 0 8px rgba(249,115,22,0.40); }
.pr-dot-item:not(.on) { width: 5px; }
.pr-swipe-hint { text-align: center; font-size: 9.5px; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(234,88,12,0.55); padding: 6px 0 4px; }
.pr-footer { text-align: center; padding: 26px 20px 34px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #888888; animation: fade-up 0.55s 0.22s ease both; }

/* ══════════════════════════════════════════════════════════
📱 MOBILE — CONSTRUCTION BUILDING BG + BLACK OVERLAY + ALL ORANGE BUTTONS
══════════════════════════════════════════════════════════ */
@media (max-width: 1023px) {

  /* ── HIDE desktop-only elements ── */
  .pr-bg, .pr-grid, .pr-orb,
  .pr-card-head, .pr-img-wrap, .pr-desc, .pr-features,
  .pr-nav, .pr-swipe-hint, .pr-btn { display: none !important; }

  /* ── ROOT: black base so image loads clean ── */
  .pr-root {
    background: #000000;
    overflow: hidden;
    height: 100dvh;
    max-height: 100dvh;
  }

  /* ── CONSTRUCTION BUILDING BACKGROUND IMAGE ── */
  .pr-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=85');
    background-size: cover;
    background-position: center top;
    z-index: 0;
    pointer-events: none;
  }

  /* ── TRANSPARENT BLACK OVERLAY ── */
  .pr-root::after {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.62);
    z-index: 1;
    pointer-events: none;
  }

  /* ── HIDE BLOBS ── */
  .mob-bg-canvas { display: none !important; }
  .mob-overlay { display: none !important; }

  /* ── CONTENT sits above overlay ── */
  .pr-content {
    position: relative;
    z-index: 2;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* ── HEADER ── */
  .pr-hero {
    flex-shrink: 0;
    padding: 28px 20px 20px;
    text-align: center;
    background: transparent;
    position: relative;
    overflow: hidden;
    animation: none;
  }

  .pr-logo-container {
    display: flex !important;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    position: relative;
    z-index: 2;
  }

  .mob-logo-img {
    height: 58px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 2px 12px rgba(0,0,0,0.5));
  }

  /* ── BADGE ── */
  .pr-badge {
    position: relative;
    z-index: 2;
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: rgba(249,115,22,0.20);
    border: 1.5px solid rgba(249,115,22,0.55);
    border-radius: 50px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #fb923c;
    margin-bottom: 14px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .pr-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f97316;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  /* ── TITLE ── */
  .pr-title {
    position: relative;
    z-index: 2;
    font-family: 'Syne', sans-serif;
    font-size: 34px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
    animation: fadeInUp 0.7s ease-out 0.1s both;
    text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  }

  .pr-title::before { display: none; }

  .pr-title-accent {
    display: block;
    font-size: 20px;
    font-weight: 700;
    background: linear-gradient(135deg, #f97316 0%, #fb923c 60%, #fdba74 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-top: 4px;
  }

  /* ── SUBTITLE ── */
  .pr-subtitle {
    position: relative;
    z-index: 2;
    font-size: 13px;
    color: rgba(255,255,255,0.60);
    max-width: 100%;
    margin: 8px 0 0;
    line-height: 1.6;
    font-weight: 400;
    animation: fadeInUp 0.7s ease-out 0.2s both;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(15px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── SECTION LABEL ── */
  .mob-section-label {
    position: relative;
    z-index: 2;
    display: flex !important;
    align-items: center;
    gap: 12px;
    padding: 0 20px 16px;
    margin-top: 8px;
    flex-shrink: 0;
  }

  .mob-section-text {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(249,115,22,0.85);
    white-space: nowrap;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(249,115,22,0.35);
    background: rgba(249,115,22,0.12);
  }

  .mob-section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(249,115,22,0.50), transparent);
  }

  /* ── CAROUSEL ── */
  .pr-carousel-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0;
    overflow: hidden;
    animation: none;
    min-height: 0;
    position: relative;
    z-index: 2;
  }

  .pr-viewport {
    overflow: hidden;
    cursor: default;
    touch-action: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .pr-track {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 0 18px;
    transform: none !important;
    transition: none !important;
  }

  .pr-slide {
    flex: 0 0 auto;
    padding: 0;
    animation: card-in 0.45s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }
  .pr-slide:nth-child(1) { animation-delay: 0.06s; }
  .pr-slide:nth-child(2) { animation-delay: 0.13s; }
  .pr-slide:nth-child(3) { animation-delay: 0.20s; }
  .pr-slide:nth-child(4) { animation-delay: 0.27s; }

  /* ── CARD SHELL ── */
  .pr-card {
    width: 100%;
    max-width: 100%;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    display: block;
    overflow: visible;
  }
  .pr-card::before { display: none; }
  .pr-card:hover { transform: none; box-shadow: none; border: none; }
  .pr-card:active { transform: scale(0.985); }

  /* ── PORTAL BUTTON BASE ── */
  .mob-portal-btn {
    display: flex !important;
    align-items: center;
    width: 100%;
    height: 72px;
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    position: relative;
    border: 1.5px solid rgba(255,255,255,0.30);
    box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 0 rgba(255,255,255,0.25) inset;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }

  .mob-portal-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 55%, transparent 100%);
    pointer-events: none;
    z-index: 1;
    border-radius: inherit;
  }

  .mob-portal-btn::after {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
    transform: skewX(-15deg);
    pointer-events: none;
    opacity: 0;
  }

  .mob-portal-btn:active { transform: scale(0.972); box-shadow: 0 3px 12px rgba(0,0,0,0.40); }
  .mob-portal-btn:active::after { opacity: 1; animation: shimmer 0.45s ease forwards; }

  /* ── ALL 4 BUTTONS — ORANGE VARIANTS ── */
  .pr-slide:nth-child(1) .mob-portal-btn {
    background: linear-gradient(135deg, #f97316 0%, #ea580c 55%, #c2410c 100%);
    box-shadow: 0 8px 32px rgba(249,115,22,0.50), 0 2px 0 rgba(255,255,255,0.25) inset;
  }
  .pr-slide:nth-child(2) .mob-portal-btn {
    background: linear-gradient(135deg, #fb923c 0%, #f97316 55%, #ea580c 100%);
    box-shadow: 0 8px 32px rgba(249,115,22,0.45), 0 2px 0 rgba(255,255,255,0.25) inset;
  }
  .pr-slide:nth-child(3) .mob-portal-btn {
    background: linear-gradient(135deg, #fdba74 0%, #f97316 45%, #ea580c 100%);
    box-shadow: 0 8px 32px rgba(249,115,22,0.40), 0 2px 0 rgba(255,255,255,0.25) inset;
  }
  .pr-slide:nth-child(4) .mob-portal-btn {
    background: linear-gradient(135deg, #f97316 0%, #c2410c 55%, #9a3412 100%);
    box-shadow: 0 8px 32px rgba(234,88,12,0.50), 0 2px 0 rgba(255,255,255,0.25) inset;
  }

  /* Left icon strip */
  .mob-btn-strip {
    display: flex !important;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 68px;
    min-height: 72px;
    flex-shrink: 0;
    padding: 10px 6px;
    position: relative;
    z-index: 2;
  }

  .mob-btn-strip-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,0.22);
    border: 1.5px solid rgba(255,255,255,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.4);
    flex-shrink: 0;
  }

  .mob-btn-strip-icon svg { width: 20px; height: 20px; stroke-width: 2.2; }

  .mob-btn-strip-level {
    margin-top: 4px;
    font-size: 7.5px;
    font-weight: 800;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.85);
    text-align: center;
  }

  /* Divider */
  .mob-btn-divider {
    display: block !important;
    width: 1px;
    align-self: stretch;
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.35) 25%, rgba(255,255,255,0.35) 75%, transparent);
    flex-shrink: 0;
    position: relative;
    z-index: 2;
  }

  /* Text content */
  .mob-btn-content {
    display: flex !important;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    padding: 10px 10px 10px 14px;
    gap: 1px;
    min-width: 0;
    position: relative;
    z-index: 2;
  }

  .mob-btn-role {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.80);
    margin-bottom: 1px;
  }

  .mob-btn-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
    letter-spacing: 0em;
    text-shadow: 0 1px 6px rgba(0,0,0,0.25);
  }

  .mob-btn-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.75);
    font-weight: 500;
    margin-top: 2px;
  }

  /* Arrow */
  .mob-btn-arrow {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 30px; height: 30px;
    border-radius: 50%;
    background: rgba(255,255,255,0.20);
    border: 1.5px solid rgba(255,255,255,0.40);
    margin-right: 14px;
    flex-shrink: 0;
    transition: transform 0.18s;
    position: relative;
    z-index: 2;
  }

  .mob-portal-btn:active .mob-btn-arrow { transform: translateX(3px); }
  .mob-btn-arrow svg { width: 15px; height: 15px; stroke-width: 2.5; color: #fff; }

  .pr-body { padding: 0; background: transparent; }

  /* ── NAV DOTS ── */
  .mob-nav-dots {
    display: flex !important;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding: 10px 0 6px;
    flex-shrink: 0;
  }

  .mob-nav-dot {
    height: 4px;
    border-radius: 50px;
    background: rgba(255,255,255,0.25);
    transition: all 0.3s;
  }

  /* ── FOOTER ── */
  .pr-footer {
    flex-shrink: 0;
    padding: 6px 20px 16px;
    font-size: 8.5px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.30);
    text-align: center;
    animation: none;
    position: relative;
    z-index: 2;
  }

  /* ── HIDE DESKTOP ELEMENTS ── */
  .pr-card-head, .pr-img-wrap, .pr-desc,
  .pr-features, .pr-btn { display: none !important; }
}
      `}</style>
      <div className="pr-root">
        <div className="pr-bg" aria-hidden="true" />
        <div className="pr-grid" aria-hidden="true" />
        <div className="pr-orb pr-orb-1" aria-hidden="true" />
        <div className="pr-orb pr-orb-2" aria-hidden="true" />
        <div className="mob-bg-canvas mob-only" aria-hidden="true">
          <div className="mob-blob mob-blob-1" />
          <div className="mob-blob mob-blob-2" />
          <div className="mob-blob mob-blob-3" />
          <div className="mob-blob mob-blob-4" />
        </div>
        <div className="mob-overlay mob-only" aria-hidden="true" />
        <div className="pr-content">
          <div className="pr-hero">
            <div className="pr-logo-container mob-only">
              <img src="/TMClog0s.png" alt="TMC Logo" className="mob-logo-img" />
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
              Choose your access level to continue
            </p>
          </div>
          <div className="mob-section-label mob-only">
            <span className="mob-section-text">4 Portals Available</span>
            <div className="mob-section-line" />
          </div>
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
                      <div className="pr-img-wrap">
                        <img src={c.image} alt={c.imageAlt} loading="lazy" />
                        <div className="pr-img-overlay" />
                        <div className="pr-img-label">{c.labelIcon}{c.label}</div>
                      </div>
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
                          <span>{c.btnLabel}</span>
                          <ArrowRight size={18} />
                        </Link>
                        <Link to={c.to} className="mob-portal-btn mob-only">
                          <div className="mob-btn-strip">
                            <div className="mob-btn-strip-icon">
                              {c.mobIcon}
                            </div>
                            <span className="mob-btn-strip-level">{c.level}</span>
                          </div>
                          <span className="mob-btn-divider" />
                          <div className="mob-btn-content">
                            <span className="mob-btn-role">{c.role}</span>
                            <span className="mob-btn-label">{c.btnLabel}</span>
                            <span className="mob-btn-sub">{c.btnSub}</span>
                          </div>
                          <div className="mob-btn-arrow">
                            <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pr-nav">
              <button className="pr-nav-btn" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Previous portal">
                <ChevronLeft size={15} />
              </button>
              <div className="pr-dots">
                {cards.map((_, i) => (
                  <div key={i} className={`pr-dot-item${activeIndex === i ? ' on' : ''}`} onClick={() => goTo(i)} />
                ))}
              </div>
              <button className="pr-nav-btn" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === TOTAL - 1} aria-label="Next portal">
                <ChevronRight size={15} />
              </button>
            </div>
            <p className="pr-swipe-hint">Swipe to explore portals</p>
          </div>
          <p className="pr-footer">
            Secured by enterprise-grade encryption · All access is logged and monitored
          </p>
        </div>
      </div>
    </>
  );
}
