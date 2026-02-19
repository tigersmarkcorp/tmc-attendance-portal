import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'employee') {
        navigate('/employee');
      } else if (role === 'site_admin_officer') {
        navigate('/sao');
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-pulse delay-700"></div>
            <Loader2 className="w-8 h-8 animate-spin text-blue-300 relative" />
          </div>
          <p className="text-sm text-blue-200/70 font-light tracking-widest uppercase">Establishing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .portal-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background-color: #050814;
          background-image: 
            url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .portal-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(5, 8, 20, 0.88) 0%,
            rgba(10, 15, 40, 0.82) 40%,
            rgba(15, 10, 35, 0.88) 100%
          );
          z-index: 0;
        }

        /* Ambient orbs */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
          animation: orb-float 12s ease-in-out infinite;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #3b6ef8, transparent);
          top: -200px; left: -200px;
          animation-delay: 0s;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #6c3bf8, transparent);
          bottom: -150px; right: -150px;
          animation-delay: -4s;
        }
        .orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #38bdf8, transparent);
          top: 40%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -8s;
        }

        @keyframes orb-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        /* Glass cards */
        .glass-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          overflow: hidden;
          position: relative;
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
          border-color: rgba(255, 255, 255, 0.18);
          transform: translateY(-6px);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Card header glass */
        .card-header-glass {
          backdrop-filter: blur(10px);
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Badge pill */
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

        /* Feature item glass */
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
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .feature-icon-wrap {
          padding: 8px;
          border-radius: 10px;
          flex-shrink: 0;
          backdrop-filter: blur(8px);
        }

        /* CTA buttons */
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

        .btn-blue {
          background: linear-gradient(135deg, rgba(59,110,248,0.75), rgba(37,80,220,0.75));
          box-shadow: 0 8px 32px rgba(59,110,248,0.3);
          color: white;
        }
        .btn-blue:hover { box-shadow: 0 12px 40px rgba(59,110,248,0.5); }

        .btn-emerald {
          background: linear-gradient(135deg, rgba(16,185,129,0.75), rgba(5,150,105,0.75));
          box-shadow: 0 8px 32px rgba(16,185,129,0.3);
          color: white;
        }
        .btn-emerald:hover { box-shadow: 0 12px 40px rgba(16,185,129,0.5); }

        .btn-violet {
          background: linear-gradient(135deg, rgba(139,92,246,0.75), rgba(109,40,217,0.75));
          box-shadow: 0 8px 32px rgba(139,92,246,0.3);
          color: white;
        }
        .btn-violet:hover { box-shadow: 0 12px 40px rgba(139,92,246,0.5); }

        /* Image overlay */
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
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 14px;
          font-weight: 700;
          color: white;
          font-family: 'Syne', sans-serif;
          width: fit-content;
          transition: all 0.3s ease;
        }
        .glass-card:hover .card-image-label {
          background: rgba(0,0,0,0.5);
          border-color: rgba(255,255,255,0.25);
        }

        /* Hero badge */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 50px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.7);
          margin-bottom: 20px;
        }

        .pulse-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #f59e0b;
          animation: pulse-anim 2s ease-in-out infinite;
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        /* Decorative grid */
        .grid-pattern {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        /* Portal grid */
        .portal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .portal-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Syne for headings */
        h1, h2, .syne { font-family: 'Syne', sans-serif; }

        /* Divider line */
        .glass-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          margin: 0;
        }

        /* Section label */
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
                  background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)', 
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

            {/* Portal Cards */}
            <div className="portal-grid w-full">

              {/* ─── ADMIN PORTAL ─── */}
              <div className="glass-card group flex flex-col">
                {/* Header */}
                <div className="card-header-glass" style={{ background: 'linear-gradient(135deg, rgba(59,110,248,0.12), rgba(37,80,220,0.08))' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div style={{ background: 'rgba(59,110,248,0.2)', padding: '8px', borderRadius: '10px', backdropFilter: 'blur(8px)', border: '1px solid rgba(59,110,248,0.3)' }}>
                        <Shield className="w-4 h-4" style={{ color: '#93b4ff' }} />
                      </div>
                      <span className="section-label" style={{ color: 'rgba(147,180,255,0.8)' }}>System Administrator</span>
                    </div>
                    <span className="access-badge" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                      <AlertCircle className="w-2.5 h-2.5" />
                      L4 ACCESS
                    </span>
                  </div>
                </div>

                {/* Image */}
                <div className="card-image">
                  <img src={adminPortalIcon} alt="System Administrator Workspace" />
                  <div className="card-image-overlay" style={{ background: 'linear-gradient(to top, rgba(10,20,60,0.9) 0%, rgba(10,20,60,0.3) 60%, transparent 100%)' }}></div>
                  <div className="card-image-label">
                    <Shield className="w-4 h-4" style={{ color: '#93b4ff' }} />
                    TMC System Control
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-sm text-white/40 text-center mb-5 leading-relaxed font-light">
                    Enterprise-wide governance, security policy enforcement, and organizational oversight
                  </p>

                  <div className="flex flex-col flex-1 mb-5">
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.25)' }}>
                        <UserCog className="w-3.5 h-3.5" style={{ color: '#93b4ff' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">User & Permission Management</p>
                        <p className="text-xs text-white/35 mt-0.5">Global directory administration</p>
                      </div>
                    </div>
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.25)' }}>
                        <Database className="w-3.5 h-3.5" style={{ color: '#93b4ff' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">System Analytics Dashboard</p>
                        <p className="text-xs text-white/35 mt-0.5">Real-time operational intelligence</p>
                      </div>
                    </div>
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(59,110,248,0.15)', border: '1px solid rgba(59,110,248,0.25)' }}>
                        <FileText className="w-3.5 h-3.5" style={{ color: '#93b4ff' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Compliance Reporting</p>
                        <p className="text-xs text-white/35 mt-0.5">Audit-ready documentation</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/admin/login" className="btn-glass btn-blue">
                    Access Administrator Portal
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* ─── SAO PORTAL ─── */}
              <div className="glass-card group flex flex-col">
                <div className="card-header-glass" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div style={{ background: 'rgba(16,185,129,0.2)', padding: '8px', borderRadius: '10px', backdropFilter: 'blur(8px)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <MapPin className="w-4 h-4" style={{ color: '#6ee7b7' }} />
                      </div>
                      <span className="section-label" style={{ color: 'rgba(110,231,183,0.8)' }}>TMC Site Admin Officer</span>
                    </div>
                    <span className="access-badge" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                      <CheckCircle className="w-2.5 h-2.5" />
                      L3 ACCESS
                    </span>
                  </div>
                </div>

                <div className="card-image">
                  <img src={saoPortalIcon} alt="Site Operations Workspace" />
                  <div className="card-image-overlay" style={{ background: 'linear-gradient(to top, rgba(5,30,20,0.9) 0%, rgba(5,30,20,0.3) 60%, transparent 100%)' }}></div>
                  <div className="card-image-label">
                    <MapPin className="w-4 h-4" style={{ color: '#6ee7b7' }} />
                   TMC Site Operations Hub
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-sm text-white/40 text-center mb-5 leading-relaxed font-light">
                    Multi-site management, workforce coordination, and field compliance oversight
                  </p>

                  <div className="flex flex-col flex-1 mb-5">
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Multi-Site Dashboard</p>
                        <p className="text-xs text-white/35 mt-0.5">Real-time location monitoring</p>
                      </div>
                    </div>
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <Users className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Workforce Allocation</p>
                        <p className="text-xs text-white/35 mt-0.5">Resource optimization tools</p>
                      </div>
                    </div>
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <CalendarCheck className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Compliance Auditing</p>
                        <p className="text-xs text-white/35 mt-0.5">Field operation verification</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/sao/login" className="btn-glass btn-emerald">
                    Access Site Operations Portal
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* ─── EMPLOYEE PORTAL ─── */}
              <div className="glass-card group flex flex-col">
                <div className="card-header-glass" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.08))' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div style={{ background: 'rgba(139,92,246,0.2)', padding: '8px', borderRadius: '10px', backdropFilter: 'blur(8px)', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <UserCheck className="w-4 h-4" style={{ color: '#c4b5fd' }} />
                      </div>
                      <span className="section-label" style={{ color: 'rgba(196,181,253,0.8)' }}>Employee Self-Service</span>
                    </div>
                    <span className="access-badge" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
                      <CheckCircle className="w-2.5 h-2.5" />
                      L2 ACCESS
                    </span>
                  </div>
                </div>

                <div className="card-image">
                  <img src={employeePortalIcon} alt="Employee Workspace" />
                  <div className="card-image-overlay" style={{ background: 'linear-gradient(to top, rgba(20,10,50,0.9) 0%, rgba(20,10,50,0.3) 60%, transparent 100%)' }}></div>
                  <div className="card-image-label">
                    <UserCheck className="w-4 h-4" style={{ color: '#c4b5fd' }} />
                    TMC Personal Workspace
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <p className="text-sm text-white/40 text-center mb-5 leading-relaxed font-light">
                    Attendance management, leave requests, and personal records access
                  </p>

                  <div className="flex flex-col flex-1 mb-5">
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                        <CalendarCheck className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Attendance Tracking</p>
                        <p className="text-xs text-white/35 mt-0.5">Biometric & mobile check-in</p>
                      </div>
                    </div>
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                        <FileText className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Leave Management</p>
                        <p className="text-xs text-white/35 mt-0.5">Digital request workflow</p>
                      </div>
                    </div>
                    <div className="feature-glass">
                      <div className="feature-icon-wrap" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                        <Database className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Personal Document Vault</p>
                        <p className="text-xs text-white/35 mt-0.5">Secure record storage</p>
                      </div>
                    </div>
                  </div>

                  <Link to="/employee/login" className="btn-glass btn-violet">
                    Access Employee Portal
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>{/* /portal-grid */}

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