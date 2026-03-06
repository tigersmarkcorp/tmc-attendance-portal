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
  UserCog
} from 'lucide-react';
import adminPortalIcon from '@/assets/Frontadmin.png';
import saoPortalIcon from '@/assets/FrontSite.png';
import employeePortalIcon from '@/assets/FrontEmployeet.png';

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [activeIndex, setActiveIndex] = useState(0);
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);
  const TOTAL = 3;

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
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0500' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 32, height: 32, color: '#f97316', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 11, color: 'rgba(253,186,116,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
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
      levelBg: 'rgba(239,68,68,0.15)', levelBorder: 'rgba(239,68,68,0.3)', levelText: '#fca5a5',
      accent: '#f97316', accentDim: 'rgba(249,115,22,0.18)', accentBorder: 'rgba(249,115,22,0.3)',
      accentText: '#fdba74',
      image: adminPortalIcon, imageAlt: 'Administrator',
      label: 'TMC System Control',
      labelIcon: <Shield size={15} color="#fdba74" />,
      headerIcon: <Shield size={15} color="#fdba74" />,
      description: 'Enterprise-wide governance, security policy enforcement, and organizational oversight',
      features: [
        { icon: <UserCog size={13} color="#fdba74" />, title: 'User & Permission Management', sub: 'Global directory administration' },
        { icon: <Database size={13} color="#fdba74" />, title: 'System Analytics Dashboard', sub: 'Real-time operational intelligence' },
        { icon: <FileText size={13} color="#fdba74" />, title: 'Compliance Reporting', sub: 'Audit-ready documentation' },
      ],
      btnFrom: '#f97316', btnTo: '#ea580c', btnShadow: 'rgba(249,115,22,0.4)',
      btnLabel: 'Access Administrator Portal',
      to: '/admin/login',
      isAdmin: true,
    },
    {
      role: 'TMC Site Admin Officer',
      level: 'L3 ACCESS',
      levelBg: 'rgba(249,115,22,0.15)', levelBorder: 'rgba(249,115,22,0.3)', levelText: '#fdba74',
      accent: '#ea580c', accentDim: 'rgba(234,88,12,0.18)', accentBorder: 'rgba(234,88,12,0.3)',
      accentText: '#fb923c',
      image: saoPortalIcon, imageAlt: 'Site Operations',
      label: 'TMC Site Operations Hub',
      labelIcon: <MapPin size={15} color="#fb923c" />,
      headerIcon: <MapPin size={15} color="#fb923c" />,
      description: 'Multi-site management, workforce coordination, and field compliance oversight',
      features: [
        { icon: <MapPin size={13} color="#fb923c" />, title: 'Multi-Site Dashboard', sub: 'Real-time location monitoring' },
        { icon: <Users size={13} color="#fb923c" />, title: 'Workforce Allocation', sub: 'Resource optimization tools' },
        { icon: <CalendarCheck size={13} color="#fb923c" />, title: 'Compliance Auditing', sub: 'Field operation verification' },
      ],
      btnFrom: '#ea580c', btnTo: '#c2410c', btnShadow: 'rgba(234,88,12,0.4)',
      btnLabel: 'Access Site Operations Portal',
      to: '/sao/login',
      isAdmin: false,
    },
    {
      role: 'Employee Self-Service',
      level: 'L2 ACCESS',
      levelBg: 'rgba(249,115,22,0.15)', levelBorder: 'rgba(249,115,22,0.3)', levelText: '#fed7aa',
      accent: '#fb923c', accentDim: 'rgba(251,146,60,0.18)', accentBorder: 'rgba(251,146,60,0.3)',
      accentText: '#fed7aa',
      image: employeePortalIcon, imageAlt: 'Employee',
      label: 'TMC Personal Workspace',
      labelIcon: <UserCheck size={15} color="#fed7aa" />,
      headerIcon: <UserCheck size={15} color="#fed7aa" />,
      description: 'Attendance management, leave requests, and personal records access',
      features: [
        { icon: <CalendarCheck size={13} color="#fed7aa" />, title: 'Attendance Tracking', sub: 'Biometric & mobile check-in' },
        { icon: <FileText size={13} color="#fed7aa" />, title: 'Leave Management', sub: 'Digital request workflow' },
        { icon: <Database size={13} color="#fed7aa" />, title: 'Personal Document Vault', sub: 'Secure record storage' },
      ],
      btnFrom: '#fb923c', btnTo: '#f97316', btnShadow: 'rgba(251,146,60,0.4)',
      btnLabel: 'Access Employee Portal',
      to: '/employee/login',
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
          0%, 100% { opacity: 0.13; transform: scale(1) translateZ(0); }
          50%       { opacity: 0.21; transform: scale(1.07) translateZ(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translate3d(0, 20px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        /* ── ROOT ── */
        .pr-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #080501;
          position: relative;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          /* Establish stacking context once */
          isolation: isolate;
        }

        /* ── STATIC BG — no background-attachment:fixed (destroys mobile perf) ── */
        .pr-bg {
          position: fixed;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=55');
          background-size: cover;
          background-position: center;
          /* Single GPU-composited layer */
          transform: translateZ(0);
          z-index: -3;
        }
        .pr-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, rgba(8,5,1,0.93) 0%, rgba(14,8,2,0.87) 50%, rgba(8,5,1,0.94) 100%);
        }

        /* ── GRID — opacity only, no blur ── */
        .pr-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
          z-index: -2;
        }

        /* ── ORBS — radial gradient only (no filter:blur = no repaint) ── */
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
          background: radial-gradient(circle at center, rgba(249,115,22,0.20), transparent 68%);
          top: -180px; left: -180px;
        }
        .pr-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle at center, rgba(234,88,12,0.17), transparent 68%);
          bottom: -130px; right: -130px;
          animation-delay: -5.5s;
        }

        /* ── CONTENT ── */
        .pr-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ── HERO ── */
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
          background: rgba(249,115,22,0.09);
          border: 1px solid rgba(249,115,22,0.22);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.11em;
          color: rgba(253,186,116,0.8);
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
          color: #fff;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .pr-title-accent {
          background: linear-gradient(90deg, #f97316, #fdba74, #ea580c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }
        .pr-subtitle {
          font-size: 13.5px;
          color: rgba(255,255,255,0.36);
          max-width: 400px;
          margin: 10px auto 0;
          line-height: 1.65;
          font-weight: 300;
        }

        /* ── CAROUSEL WRAPPER ── */
        .pr-carousel-wrap {
          padding: 32px 0 0;
          animation: fade-up 0.55s 0.12s ease both;
        }

        /* Viewport — overflow:hidden clips slides */
        .pr-viewport {
          width: 100%;
          overflow: hidden;
          /* Allow vertical scroll pass-through */
          touch-action: pan-y;
          cursor: grab;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-viewport:active { cursor: grabbing; }

        /* Track — GPU translate only, NO layout props change */
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

        /* ── DESKTOP: 3-col grid (no carousel) ── */
        @media (min-width: 1024px) {
          .pr-hero { padding-top: 56px; }
          .pr-viewport { overflow: visible; cursor: default !important; }
          .pr-track {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 22px;
            max-width: 1160px;
            margin: 0 auto;
            /* Override inline transform from JS */
            transform: none !important;
            transition: none !important;
          }
          .pr-slide { padding: 0 0 6px; }
          .pr-nav,
          .pr-swipe-hint { display: none !important; }
        }

        /* Tablet: wider padding */
        @media (min-width: 600px) and (max-width: 1023px) {
          .pr-slide { padding: 0 40px 6px; }
        }

        /* ── CARD ── */
        .pr-card {
          width: 100%;
          max-width: 430px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          /* Dark semi-opaque bg — single backdrop-filter is cheap */
          background: rgba(10, 6, 2, 0.75);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          /* Own GPU layer */
          transform: translateZ(0);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        /* Shimmer top line — zero cost */
        .pr-card::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent);
          flex-shrink: 0;
        }
        .pr-card:hover {
          border-color: rgba(249,115,22,0.26);
          box-shadow: 0 22px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(249,115,22,0.07);
          transform: translateY(-5px) translateZ(0);
        }

        /* Card header */
        .pr-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 17px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
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
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        @media (min-width: 600px) { .pr-img-wrap { height: 250px; } }
        @media (min-width: 1024px) { .pr-img-wrap { height: 230px; } }

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

        /* Gradient overlay — NO filter:blur */
        .pr-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(8,4,1,0.88) 0%, rgba(8,4,1,0.18) 52%, transparent 100%);
        }
        .pr-img-label {
          position: absolute;
          bottom: 11px; left: 11px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 50px;
          background: rgba(0,0,0,0.44);
          border: 1px solid rgba(249,115,22,0.2);
          font-size: 12.5px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          color: #fff;
          white-space: nowrap;
        }

        /* Card body */
        .pr-body {
          padding: 16px 16px 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .pr-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.36);
          text-align: center;
          margin-bottom: 14px;
          line-height: 1.65;
          font-weight: 300;
        }

        /* Features */
        .pr-features { flex: 1; margin-bottom: 14px; display: flex; flex-direction: column; gap: 7px; }
        .pr-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          transition: background 0.2s, border-color 0.2s;
        }
        .pr-card:hover .pr-feature {
          background: rgba(249,115,22,0.045);
          border-color: rgba(249,115,22,0.13);
        }
        .pr-feat-icon { padding: 7px; border-radius: 8px; flex-shrink: 0; }
        .pr-feat-title { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.82); line-height: 1.3; }
        .pr-feat-sub   { font-size: 10.5px; color: rgba(255,255,255,0.3); margin-top: 2px; }

        /* CTA Button — NO backdrop-filter, just gradient */
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
          background: linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%);
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
          border: 1px solid rgba(249,115,22,0.22);
          background: rgba(249,115,22,0.07);
          color: rgba(253,186,116,0.85);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .pr-nav-btn:hover {
          background: rgba(249,115,22,0.17);
          border-color: rgba(249,115,22,0.44);
          box-shadow: 0 0 12px rgba(249,115,22,0.24);
        }
        .pr-nav-btn:disabled { opacity: 0.22; cursor: not-allowed; }

        .pr-dots { display: flex; gap: 7px; align-items: center; }
        .pr-dot-item {
          height: 5px;
          border-radius: 50px;
          background: rgba(249,115,22,0.22);
          cursor: pointer;
          transition: width 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
        }
        .pr-dot-item.on {
          width: 22px;
          background: #f97316;
          box-shadow: 0 0 8px rgba(249,115,22,0.48);
        }
        .pr-dot-item:not(.on) { width: 5px; }

        /* Swipe hint */
        .pr-swipe-hint {
          text-align: center;
          font-size: 9.5px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(249,115,22,0.32);
          padding: 6px 0 4px;
        }

        /* Footer */
        .pr-footer {
          text-align: center;
          padding: 26px 20px 34px;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          animation: fade-up 0.55s 0.22s ease both;
        }
      `}</style>

      <div className="pr-root">
        <div className="pr-bg" aria-hidden="true" />
        <div className="pr-grid" aria-hidden="true" />
        <div className="pr-orb pr-orb-1" aria-hidden="true" />
        <div className="pr-orb pr-orb-2" aria-hidden="true" />

        <div className="pr-content">

          {/* Hero */}
          <div className="pr-hero">
            <div className="pr-badge">
              <span className="pr-dot" />
              NEW ENTERPRISE INTERFACE &nbsp;·&nbsp; v3.2
            </div>
            <h2 className="pr-title">
              Unified Workspace
              <span className="pr-title-accent">Tiger's Mark Corp Portal</span>
            </h2>
            <p className="pr-subtitle">
              Securely access your role-specific environment with enterprise-grade governance and compliance controls
            </p>
          </div>

          {/* Carousel */}
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

                      {/* Header */}
                      <div className="pr-card-head" style={{ background: `linear-gradient(135deg, ${c.accentDim}, transparent)` }}>
                        <div className="pr-card-head-left">
                          <div className="pr-head-icon" style={{ background: c.accentDim, border: `1px solid ${c.accentBorder}` }}>
                            {c.headerIcon}
                          </div>
                          <span className="pr-role-label" style={{ color: c.accentText }}>{c.role}</span>
                        </div>
                        <span className="pr-badge-pill" style={{ background: c.levelBg, border: `1px solid ${c.levelBorder}`, color: c.levelText }}>
                          {c.isAdmin ? <AlertCircle size={9} /> : <CheckCircle size={9} />}
                          {c.level}
                        </span>
                      </div>

                      {/* Image */}
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
                          {c.btnLabel}
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav controls */}
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
