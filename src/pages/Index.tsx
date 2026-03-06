import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { 
  Clock, 
  Loader2, 
  ArrowRight,
  Shield,
  Users,
  UserCheck,
  Building2,
  Lock,
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

  // ── Swipe / carousel state ──────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);
  const TOTAL = 3;

  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, idx));
    setActiveIndex(clamped);
  };

  // Touch & mouse drag handlers
  const onPointerDown = (e) => {
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    isDraggingRef.current = true;
  };
  const onPointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = startXRef.current - endX;
    if (Math.abs(diff) > 50) goTo(activeIndex + (diff > 0 ? 1 : -1));
  };

  // ── Auth redirect (logic untouched) ────────────────────────────────────
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'employee') navigate('/employee');
      else if (role === 'site_admin_officer') navigate('/sao');
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-orange-400/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 bg-orange-400/30 rounded-full animate-pulse delay-700"></div>
            <Loader2 className="w-8 h-8 animate-spin text-orange-300 relative" />
          </div>
          <p className="text-sm text-orange-200/70 font-light tracking-widest uppercase">Establishing secure session...</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      role: 'System Administrator',
      level: 'L4 ACCESS',
      levelColor: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
      accentRgb: '249,115,22',
      accentHex: '#f97316',
      accentLight: '#fdba74',
      headerBg: 'linear-gradient(135deg, rgba(249,115,22,0.14), rgba(234,88,12,0.08))',
      image: adminPortalIcon,
      imageAlt: 'System Administrator Workspace',
      overlayBg: 'linear-gradient(to top, rgba(40,12,4,0.92) 0%, rgba(40,12,4,0.3) 60%, transparent 100%)',
      label: 'TMC System Control',
      labelIcon: <Shield className="w-4 h-4" style={{ color: '#fdba74' }} />,
      headerIcon: <Shield className="w-4 h-4" style={{ color: '#fdba74' }} />,
      description: 'Enterprise-wide governance, security policy enforcement, and organizational oversight',
      features: [
        { icon: <UserCog className="w-3.5 h-3.5" style={{ color: '#fdba74' }} />, title: 'User & Permission Management', sub: 'Global directory administration' },
        { icon: <Database className="w-3.5 h-3.5" style={{ color: '#fdba74' }} />, title: 'System Analytics Dashboard', sub: 'Real-time operational intelligence' },
        { icon: <FileText className="w-3.5 h-3.5" style={{ color: '#fdba74' }} />, title: 'Compliance Reporting', sub: 'Audit-ready documentation' },
      ],
      btnClass: 'btn-orange',
      btnLabel: 'Access Administrator Portal',
      to: '/admin/login',
    },
    {
      role: 'TMC Site Admin Officer',
      level: 'L3 ACCESS',
      levelColor: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', text: '#fdba74' },
      accentRgb: '234,88,12',
      accentHex: '#ea580c',
      accentLight: '#fb923c',
      headerBg: 'linear-gradient(135deg, rgba(234,88,12,0.14), rgba(194,65,12,0.08))',
      image: saoPortalIcon,
      imageAlt: 'Site Operations Workspace',
      overlayBg: 'linear-gradient(to top, rgba(35,10,2,0.92) 0%, rgba(35,10,2,0.3) 60%, transparent 100%)',
      label: 'TMC Site Operations Hub',
      labelIcon: <MapPin className="w-4 h-4" style={{ color: '#fb923c' }} />,
      headerIcon: <MapPin className="w-4 h-4" style={{ color: '#fb923c' }} />,
      description: 'Multi-site management, workforce coordination, and field compliance oversight',
      features: [
        { icon: <MapPin className="w-3.5 h-3.5" style={{ color: '#fb923c' }} />, title: 'Multi-Site Dashboard', sub: 'Real-time location monitoring' },
        { icon: <Users className="w-3.5 h-3.5" style={{ color: '#fb923c' }} />, title: 'Workforce Allocation', sub: 'Resource optimization tools' },
        { icon: <CalendarCheck className="w-3.5 h-3.5" style={{ color: '#fb923c' }} />, title: 'Compliance Auditing', sub: 'Field operation verification' },
      ],
      btnClass: 'btn-deeporange',
      btnLabel: 'Access Site Operations Portal',
      to: '/sao/login',
    },
    {
      role: 'Employee Self-Service',
      level: 'L2 ACCESS',
      levelColor: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', text: '#fed7aa' },
      accentRgb: '253,186,116',
      accentHex: '#fdba74',
      accentLight: '#fff7ed',
      headerBg: 'linear-gradient(135deg, rgba(253,186,116,0.10), rgba(249,115,22,0.06))',
      image: employeePortalIcon,
      imageAlt: 'Employee Workspace',
      overlayBg: 'linear-gradient(to top, rgba(40,20,5,0.92) 0%, rgba(40,20,5,0.3) 60%, transparent 100%)',
      label: 'TMC Personal Workspace',
      labelIcon: <UserCheck className="w-4 h-4" style={{ color: '#fed7aa' }} />,
      headerIcon: <UserCheck className="w-4 h-4" style={{ color: '#fed7aa' }} />,
      description: 'Attendance management, leave requests, and personal records access',
      features: [
        { icon: <CalendarCheck className="w-3.5 h-3.5" style={{ color: '#fed7aa' }} />, title: 'Attendance Tracking', sub: 'Biometric & mobile check-in' },
        { icon: <FileText className="w-3.5 h-3.5" style={{ color: '#fed7aa' }} />, title: 'Leave Management', sub: 'Digital request workflow' },
        { icon: <Database className="w-3.5 h-3.5" style={{ color: '#fed7aa' }} />, title: 'Personal Document Vault', sub: 'Secure record storage' },
      ],
      btnClass: 'btn-amber',
      btnLabel: 'Access Employee Portal',
      to: '/employee/login',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .portal-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background-color: #050814;
          background-image: url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          position: relative;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }

        .portal-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(5, 8, 20, 0.90) 0%,
            rgba(20, 10, 5, 0.85) 40%,
            rgba(15, 8, 3, 0.90) 100%
          );
          z-index: 0;
        }

        /* Ambient orbs — orange palette */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
          animation: orb-float 12s ease-in-out infinite;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #f97316, transparent);
          top: -200px; left: -200px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #ea580c, transparent);
          bottom: -150px; right: -150px;
          animation-delay: -4s;
        }
        .orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #fdba74, transparent);
          top: 40%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -8s;
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        .grid-pattern {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(249,115,22,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── CAROUSEL ─────────────────────────────────────── */
        .carousel-viewport {
          width: 100%;
          overflow: hidden;
          position: relative;
          /* allow click-drag on desktop */
          user-select: none;
          cursor: grab;
        }
        .carousel-viewport:active { cursor: grabbing; }

        .carousel-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
          will-change: transform;
        }

        .carousel-slide {
          flex: 0 0 100%;
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 0 16px;
          box-sizing: border-box;
        }

        /* On desktop show 3-up grid instead of carousel */
        @media (min-width: 1024px) {
          .carousel-viewport { overflow: visible; cursor: default; }
          .carousel-track {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            transform: none !important;
            max-width: 1200px;
            margin: 0 auto;
          }
          .carousel-slide {
            padding: 0;
          }
          .carousel-nav { display: none !important; }
          .carousel-dots { display: none !important; }
        }

        /* ── GLASS CARD ───────────────────────────────────── */
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
          position: relative;
          width: 100%;
          max-width: 400px;
        }
        .glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          z-index: 1;
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(249,115,22,0.25);
          transform: translateY(-6px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(249,115,22,0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .card-header-glass {
          backdrop-filter: blur(10px);
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .access-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 10px;
          border-radius: 50px;
          backdrop-filter: blur(8px);
        }
        .feature-glass {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          transition: all 0.25s ease;
          margin-bottom: 10px;
        }
        .feature-glass:last-child { margin-bottom: 0; }
        .glass-card:hover .feature-glass {
          background: rgba(249,115,22,0.06);
          border-color: rgba(249,115,22,0.15);
        }
        .feature-icon-wrap {
          padding: 8px;
          border-radius: 10px;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }

        /* ── CTA BUTTONS ──────────────────────────────────── */
        .btn-glass {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer;
          text-decoration: none;
        }
        .btn-glass::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-glass:hover::after { opacity: 1; }
        .btn-glass:hover { transform: translateY(-1px); }

        .btn-orange {
          background: linear-gradient(135deg, rgba(249,115,22,0.80), rgba(234,88,12,0.80));
          box-shadow: 0 8px 32px rgba(249,115,22,0.35);
          color: white;
        }
        .btn-orange:hover { box-shadow: 0 12px 40px rgba(249,115,22,0.55); }

        .btn-deeporange {
          background: linear-gradient(135deg, rgba(234,88,12,0.80), rgba(194,65,12,0.80));
          box-shadow: 0 8px 32px rgba(234,88,12,0.35);
          color: white;
        }
        .btn-deeporange:hover { box-shadow: 0 12px 40px rgba(234,88,12,0.55); }

        .btn-amber {
          background: linear-gradient(135deg, rgba(251,146,60,0.80), rgba(249,115,22,0.80));
          box-shadow: 0 8px 32px rgba(251,146,60,0.35);
          color: white;
        }
        .btn-amber:hover { box-shadow: 0 12px 40px rgba(251,146,60,0.55); }

        /* ── CARD IMAGE ───────────────────────────────────── */
        .card-image {
          position: relative;
          width: 100%;
          height: 300px;
          overflow: hidden;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .card-image img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center top;
          transition: transform 0.7s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .glass-card:hover .card-image img { transform: scale(1.04); }
        .card-image-overlay {
          position: absolute;
          inset: 0;
          transition: opacity 0.3s;
        }
        .glass-card:hover .card-image-overlay { opacity: 0.75; }
        .card-image-label {
          position: absolute;
          bottom: 14px; left: 14px; right: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 50px;
          backdrop-filter: blur(16px) saturate(180%);
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(249,115,22,0.25);
          font-size: 14px;
          font-weight: 700;
          color: white;
          font-family: 'Syne', sans-serif;
          width: fit-content;
          transition: all 0.3s ease;
        }
        .glass-card:hover .card-image-label {
          background: rgba(0,0,0,0.5);
          border-color: rgba(249,115,22,0.45);
        }

        /* ── HERO BADGE ───────────────────────────────────── */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 50px;
          background: rgba(249,115,22,0.08);
          border: 1px solid rgba(249,115,22,0.22);
          backdrop-filter: blur(12px);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(253,186,116,0.85);
          margin-bottom: 20px;
        }
        .pulse-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f97316;
          animation: pulse-anim 2s ease-in-out infinite;
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        /* ── CAROUSEL NAVIGATION ──────────────────────────── */
        .carousel-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 28px;
        }
        .nav-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(249,115,22,0.25);
          background: rgba(249,115,22,0.08);
          backdrop-filter: blur(10px);
          color: rgba(253,186,116,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .nav-btn:hover {
          background: rgba(249,115,22,0.22);
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 0 16px rgba(249,115,22,0.3);
          color: #fdba74;
        }
        .nav-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }

        /* ── DOTS ─────────────────────────────────────────── */
        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 18px;
        }
        .dot {
          height: 6px;
          border-radius: 50px;
          background: rgba(249,115,22,0.25);
          transition: all 0.35s ease;
          cursor: pointer;
        }
        .dot.active {
          width: 28px;
          background: #f97316;
          box-shadow: 0 0 10px rgba(249,115,22,0.5);
        }
        .dot:not(.active) {
          width: 6px;
        }
        .dot:hover:not(.active) {
          background: rgba(249,115,22,0.5);
        }

        /* ── SWIPE HINT ───────────────────────────────────── */
        .swipe-hint {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(249,115,22,0.4);
          text-align: center;
          margin-top: 10px;
        }

        h1, h2, .syne { font-family: 'Syne', sans-serif; }
        .section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <div className="portal-root">
        {/* Ambient Effects */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="grid-pattern"></div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 flex flex-col items-center justify-center">

            {/* Hero Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <div className="hero-badge">
                <span className="pulse-dot"></span>
                NEW ENTERPRISE INTERFACE &nbsp;·&nbsp; v3.2
              </div>
              <h2 className="syne text-3xl md:text-4xl lg:text-5xl font-800 mb-4 text-white tracking-tight leading-tight">
                Unified Workspace
                <span style={{ 
                  background: 'linear-gradient(90deg, #f97316, #fdba74, #ea580c)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'block'
                }}>
                  Tiger's Mark Corp Portal
                </span>
              </h2>
              <p className="text-base text-white/45 max-w-lg mx-auto leading-relaxed font-light">
                Securely access your role-specific environment with enterprise-grade governance and compliance controls
              </p>
            </div>

            {/* ── CAROUSEL / 3-up grid ─────────────────────────────────────── */}
            <div className="w-full">
              <div
                className="carousel-viewport"
                ref={trackRef}
                onMouseDown={onPointerDown}
                onMouseUp={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchEnd={onPointerUp}
              >
                <div
                  className="carousel-track"
                  style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                  {cards.map((card, i) => (
                    <div className="carousel-slide" key={i}>
                      <div className="glass-card group flex flex-col">

                        {/* Card Header */}
                        <div className="card-header-glass" style={{ background: card.headerBg }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div style={{
                                background: `rgba(${card.accentRgb},0.2)`,
                                padding: '8px', borderRadius: '10px',
                                backdropFilter: 'blur(8px)',
                                border: `1px solid rgba(${card.accentRgb},0.3)`
                              }}>
                                {card.headerIcon}
                              </div>
                              <span className="section-label" style={{ color: `rgba(${card.accentRgb},0.85)` }}>{card.role}</span>
                            </div>
                            <span className="access-badge" style={{
                              background: card.levelColor.bg,
                              border: `1px solid ${card.levelColor.border}`,
                              color: card.levelColor.text
                            }}>
                              {i === 0 ? <AlertCircle className="w-2.5 h-2.5" /> : <CheckCircle className="w-2.5 h-2.5" />}
                              {card.level}
                            </span>
                          </div>
                        </div>

                        {/* Image */}
                        <div className="card-image">
                          <img src={card.image} alt={card.imageAlt} draggable={false} />
                          <div className="card-image-overlay" style={{ background: card.overlayBg }}></div>
                          <div className="card-image-label">
                            {card.labelIcon}
                            {card.label}
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col flex-1">
                          <p className="text-sm text-white/40 text-center mb-5 leading-relaxed font-light">
                            {card.description}
                          </p>

                          <div className="flex flex-col flex-1 mb-5">
                            {card.features.map((f, fi) => (
                              <div className="feature-glass" key={fi}>
                                <div className="feature-icon-wrap" style={{
                                  background: `rgba(${card.accentRgb},0.15)`,
                                  border: `1px solid rgba(${card.accentRgb},0.25)`
                                }}>
                                  {f.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white/80">{f.title}</p>
                                  <p className="text-xs text-white/35 mt-0.5">{f.sub}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Link to={card.to} className={`btn-glass ${card.btnClass}`}>
                            {card.btnLabel}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prev / Next arrows — mobile only */}
              <div className="carousel-nav">
                <button
                  className="nav-btn"
                  onClick={() => goTo(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  aria-label="Previous portal"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dots */}
                <div className="carousel-dots" style={{ margin: 0 }}>
                  {cards.map((_, i) => (
                    <div
                      key={i}
                      className={`dot${activeIndex === i ? ' active' : ''}`}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>

                <button
                  className="nav-btn"
                  onClick={() => goTo(activeIndex + 1)}
                  disabled={activeIndex === TOTAL - 1}
                  aria-label="Next portal"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Swipe hint — mobile only */}
              <p className="swipe-hint lg:hidden">Swipe to explore portals</p>
            </div>

            {/* Footer note */}
            <p className="mt-10 text-xs text-white/20 tracking-widest uppercase text-center">
              Secured by enterprise-grade encryption &nbsp;·&nbsp; All access is logged and monitored
            </p>

          </section>
        </div>
      </div>
    </>
  );
}
