import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  Loader2,
  ArrowRight,
  ChevronDown,
  Check,
  Menu,
  X,
  Shield,
  Users,
  UserCheck,
  CalendarCheck,
  FileText,
  MapPin,
  UserCog,
  Database,
  Keyboard,
  HardHat,
  Wallet,
  ClipboardCheck,
  LockKeyhole,
  Building2,
  Factory,
  Truck,
  Store,
  Layers,
  UserPlus,
  Fingerprint,
  Smartphone,
  Laptop,
  Minus,
  Download,
} from 'lucide-react';
import adminPortalIcon from '@/assets/Frontadmin.png';
import saoPortalIcon from '@/assets/FrontSite.png';
import employeePortalIcon from '@/assets/FrontEmployeet.png';
import encoderPortalIcon from '@/assets/encoder-portal-icon.png';
import workerPortalIcon from '@/assets/workers.png';
import heroGadget from '@/assets/herogadget.png';
import modelAppsImage from '@/assets/model1.png';
import modelAppsImage2 from '@/assets/model2.png';
import modelAppsImage3 from '@/assets/model3.png';
import modelAppsImage4 from '@/assets/model4.png';
import modelAppsImage5 from '@/assets/model5.png';
import modelAppsImage6 from '@/assets/model6.png';
import modelAppsImage7 from '@/assets/model7.png';
import modelAppsImage8 from '@/assets/model8.png';
import modelAppsImage9 from '@/assets/model9.png';
import modelAppsImage10 from '@/assets/model10.png';
import modelAppsImage11 from '@/assets/model11.png';
import modelAppsImage12 from '@/assets/model12.png';

/* ───────────────────────── DATA ───────────────────────── */

const PORTALS = [
  {
    id: 'admin',
    menuLabel: 'Administrator',
    menuSub: 'System control',
    icon: Shield,
    level: 'Level 4 access',
    title: 'System Administrator',
    lead: 'Set the rules for your whole company.',
    description:
      'Manage every account, permission and security policy in your workspace, and keep a clear view of how the system is being used.',
    features: [
      { icon: UserCog, title: 'User and permission management', sub: 'Create accounts and control who can see what' },
      { icon: Database, title: 'System analytics dashboard', sub: 'Live usage and operational figures' },
      { icon: FileText, title: 'Compliance reporting', sub: 'Audit-ready documents on demand' },
    ],
    cta: 'Log in as Administrator',
    to: '/admin/login',
    image: modelAppsImage8,
    imageAlt: 'Administrator portal preview',
  },
  {
    id: 'sao',
    menuLabel: 'Site Admin Officer',
    menuSub: 'Field management',
    icon: MapPin,
    level: 'Level 3 access',
    title: 'Site Admin Officer',
    lead: 'Keep every site staffed and in order.',
    description:
      'Coordinate workers across multiple locations, assign people where they are needed, and verify that field operations meet company requirements.',
    features: [
      { icon: MapPin, title: 'Multi-site dashboard', sub: 'Monitor each location in real time' },
      { icon: Users, title: 'Workforce allocation', sub: 'Move and assign workers between sites' },
      { icon: CalendarCheck, title: 'Compliance auditing', sub: 'Check field records against requirements' },
    ],
    cta: 'Log in as Site Admin Officer',
    to: '/sao/login',
    image: modelAppsImage9,
    imageAlt: 'Site Admin Officer portal preview',
  },
  {
    id: 'employee',
    menuLabel: 'Employee',
    menuSub: 'Self service',
    icon: UserCheck,
    level: 'Level 2 access',
    title: 'Employee',
    lead: 'Your attendance, leave and records in one workspace.',
    description:
      'Check in, request time off and open your personal documents without going through the office.',
    features: [
      { icon: CalendarCheck, title: 'Attendance tracking', sub: 'Biometric and mobile check-in' },
      { icon: FileText, title: 'Leave management', sub: 'File a request and follow its approval' },
      { icon: Database, title: 'Personal document vault', sub: 'Your records, stored securely' },
    ],
    cta: 'Log in as Employee',
    to: '/employee/login',
    image: modelAppsImage10 ,
    imageAlt: 'Employee portal preview',
  },
  {
    id: 'encoder',
    menuLabel: 'Encoder',
    menuSub: 'Data entry',
    icon: Keyboard,
    level: 'Level 1 access',
    title: 'Encoder',
    lead: 'Enter worker and employee data once, and get it right.',
    description:
      'Encode new records, correct existing ones and run validation checks so the information other portals rely on stays accurate.',
    features: [
      { icon: Keyboard, title: 'Worker data entry', sub: 'Fast forms built for encoding' },
      { icon: FileText, title: 'Employee records', sub: 'Update details and keep history intact' },
      { icon: Database, title: 'Data validation', sub: 'Catch errors before they are saved' },
    ],
    cta: 'Log in as Encoder',
    to: '/encoder/login',
    image: modelAppsImage11,
    imageAlt: 'Encoder portal preview',
  },
  {
    id: 'worker',
    menuLabel: 'Worker',
    menuSub: 'Field worker',
    icon: HardHat,
    level: 'Level 1 access',
    title: 'Field Worker',
    lead: 'Know where you are working, when, and what you earn.',
    description:
      'Clock in and out on site, see your shift schedule and read your payslips from your phone.',
    features: [
      { icon: CalendarCheck, title: 'Attendance and shifts', sub: 'On-site clock in and clock out' },
      { icon: Wallet, title: 'Payroll and payslips', sub: 'Earnings and deductions per pay period' },
      { icon: HardHat, title: 'Site assignments', sub: 'Your current job site and details' },
    ],
    cta: 'Log in as Worker',
    to: '/worker/login',
    image: modelAppsImage12,
    imageAlt: 'Field worker portal preview',
  },
];

/* Feature tabs: every item below comes from capabilities already listed in the portals above. */
const FEATURE_GROUPS = [
  {
    id: 'time',
    label: 'Time and attendance',
    menuSub: 'Check-in, shifts and leave',
    icon: CalendarCheck,
    image: modelAppsImage2,
    items: [
      { title: 'Mobile check-in', text: 'Workers and employees clock in from their phones.' },
      { title: 'On-site clock in and out', text: 'Attendance is recorded where the work happens.' },
      { title: 'Shift schedules', text: 'Everyone can see their upcoming shifts.' },
      { title: 'Leave requests', text: 'File a request and follow it through approval.' },
      { title: 'Site assignments', text: 'Each worker sees their current job site and details.' },
    ],
  },
  {
    id: 'control',
    label: 'Verification and control',
    menuSub: 'Access, checks and audit',
    icon: LockKeyhole,
    image: modelAppsImage3,
    items: [
      { title: 'Biometric check-in', text: 'Tie each attendance entry to the person who made it.' },
      { title: 'Role-based access', text: 'Each role sees only what it needs.' },
      { title: 'Data validation', text: 'Errors are caught before records are saved.' },
      { title: 'Location monitoring', text: 'See how each site is staffed as it happens.' },
      { title: 'Audit trail', text: 'Every sign-in is logged and monitored.' },
    ],
  },
  {
    id: 'manage',
    label: 'People and sites',
    menuSub: 'Teams, records and locations',
    icon: MapPin,
    image: modelAppsImage4,
    items: [
      { title: 'Multi-site dashboard', text: 'One view across every location you run.' },
      { title: 'Workforce allocation', text: 'Move and assign workers between sites.' },
      { title: 'Employee records', text: 'Update details and keep history intact.' },
      { title: 'Personal document vault', text: 'Store each person\u2019s records securely.' },
      { title: 'Compliance auditing', text: 'Check field records against your requirements.' },
    ],
  },
  {
    id: 'reports',
    label: 'Payroll and reports',
    menuSub: 'Payslips and analytics',
    icon: FileText,
    image: modelAppsImage5,
    items: [
      { title: 'Payroll and payslips', text: 'Earnings and deductions for every pay period.' },
      { title: 'Analytics dashboard', text: 'Live usage and operational figures.' },
      { title: 'Compliance reporting', text: 'Audit-ready documents on demand.' },
      { title: 'One set of records', text: 'Attendance, leave and shifts feed the same data.' },
    ],
  },
];

const INDUSTRIES = [
  {
    id: 'construction',
    icon: HardHat,
    label: 'Construction',
    menuSub: 'Job sites and field crews',
    headline: 'Built for the job site',
    image: modelAppsImage6,
    imageAlt: 'Construction industry preview',
    bullets: [
      'Assign workers to the right job site',
      'Clock in and out on site',
      'See every location in one dashboard',
      'Payslips ready at the end of each period',
    ],
    roles: ['Site Admin Officer', 'Field Worker', 'Encoder'],
  },
  {
    id: 'manufacturing',
    icon: Factory,
    label: 'Manufacturing',
    menuSub: 'Shifts on the production floor',
    headline: 'Built for the factory floor',
    image: modelAppsImage6,
    imageAlt: 'Manufacturing industry preview',
    bullets: [
      'Shift schedules for every team',
      'Attendance for the production floor',
      'Leave requests handled in one place',
      'Records validated before payroll',
    ],
    roles: ['Employee', 'Encoder', 'Administrator'],
  },
  {
    id: 'security',
    icon: Shield,
    label: 'Security services',
    menuSub: 'Posts across client sites',
    headline: 'Built for teams spread across client sites',
    image: modelAppsImage6,
    imageAlt: 'Security services industry preview',
    bullets: [
      'Site assignments for every person',
      'Attendance across many client locations',
      'An audit trail you can point to',
      'Access levels for supervisors and officers',
    ],
    roles: ['Site Admin Officer', 'Field Worker', 'Administrator'],
  },
  {
    id: 'logistics',
    icon: Truck,
    label: 'Logistics',
    menuSub: 'Depots, crews and routes',
    headline: 'Built for depots and crews on the move',
    image: modelAppsImage6,
    imageAlt: 'Logistics industry preview',
    bullets: [
      'Attendance across depots and sites',
      'Shift schedules for crews',
      'Location monitoring as work happens',
      'Payroll-ready records for each period',
    ],
    roles: ['Site Admin Officer', 'Field Worker', 'Employee'],
  },
  {
    id: 'retail',
    icon: Store,
    label: 'Retail and food service',
    menuSub: 'Branches and store teams',
    headline: 'Built for branches and store teams',
    image: modelAppsImage6,
    imageAlt: 'Retail and food service industry preview',
    bullets: [
      'Attendance for every branch in one view',
      'Shift schedules for store teams',
      'Self-service leave and records for staff',
      'One workspace across all branches',
    ],
    roles: ['Employee', 'Site Admin Officer', 'Administrator'],
  },
];

const PILLARS = [
  { icon: Fingerprint, title: 'Accurate attendance', text: 'Biometric and mobile check-in tie every entry to a person and a site, so the record matches what happened.' },
  { icon: Wallet, title: 'Payroll you can trust', text: 'Attendance, leave and shifts feed one set of records, so payslips are built from the same data everyone sees.' },
  { icon: ClipboardCheck, title: 'Ready for audits', text: 'Every sign-in is logged, and compliance reports are ready when someone asks for them.' },
];

const WORKSPACE_POINTS = [
  { icon: Building2, title: 'A workspace for every company', text: 'Each company signs up once and gets its own space. Nothing is shared with any other company.' },
  { icon: Users, title: 'Your own users and roles', text: 'Invite your people and give each one the portal that matches their job.' },
  { icon: Layers, title: 'Your own sites and settings', text: 'Sites, shifts, leave rules and pay periods are set up per company, not globally.' },
];

const STEPS = [
  { icon: Building2, title: 'Create your workspace', text: 'Register your company and choose who will be the first administrator.' },
  { icon: UserPlus, title: 'Invite your team', text: 'Add administrators, site officers, employees, encoders and workers, each with the right role.' },
  { icon: CalendarCheck, title: 'Track work and pay people', text: 'Attendance flows into payroll, and everyone sees their own records in their portal.' },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    for: 'Essential attendance and employee management for small teams',
    price: '₱99',
    priceSuffix: '/ user / month',
    priceNote: 'Every registered user is billed ₱99 per month.',
    features: [
      'Administration Portal',
      'Employee Portal',
      'Employee management & profiles',
      'Clock In / Clock Out and break management',
      'Attendance tracking and history',
      'Payroll viewing and leave requests',
      'Admin dashboard and basic analytics',
      'Web app, PWA and Employee mobile app',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    for: 'Complete workforce management with all TMC operational portals',
    price: 'Contact TMC',
    priceSuffix: 'up to 150 users',
    priceNote: 'Pricing is quoted for your team size.',
    badge: 'For multi-site teams',
    features: [
      'Everything in Starter, plus:',
      'Site Officer, Worker & Encoder Portals',
      'Multiple work locations & assignments',
      'My Workers and SAO Page',
      'Real-time workforce monitoring',
      'Automated payroll computation',
      'Advanced analytics, charts and dashboards',
      'Native Employee, Worker and Site Officer apps',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    for: 'Customized workforce management for larger organizations',
    price: 'Custom',
    priceSuffix: '150+ users',
    priceNote: 'Priced around your users, sites and requirements.',
    features: [
      'Everything in Business, plus:',
      '150 / 250 / 500 / 1,000 / 2,000+ users',
      'Custom dashboards & advanced payroll config',
      'Custom roles, permissions and workflows',
      'API integrations and custom branding',
      'Additional storage & enterprise security',
      'Dedicated deployment configuration',
      'Priority support',
    ],
  },
];

const PLAN_COMPARISON_ROWS = [
  { label: 'Pricing', starter: '₱99/user/month', business: 'Contact TMC', enterprise: 'Custom' },
  { label: 'Users', starter: 'Per-user', business: 'Up to 150', enterprise: '150+' },
  { label: 'Admin Portal', starter: true, business: true, enterprise: true },
  { label: 'Employee Portal', starter: true, business: true, enterprise: true },
  { label: 'Site Officers Portal', starter: false, business: true, enterprise: true },
  { label: 'Workers Portal', starter: false, business: true, enterprise: true },
  { label: 'Encoder Portal', starter: false, business: true, enterprise: true },
  { label: 'Attendance', starter: true, business: true, enterprise: true },
  { label: 'Payroll', starter: true, business: true, enterprise: true },
  { label: 'Multiple Locations', starter: 'Basic', business: true, enterprise: true },
  { label: 'My Workers', starter: false, business: true, enterprise: true },
  { label: 'SAO Page', starter: false, business: true, enterprise: true },
  { label: 'Real-Time Monitoring', starter: 'Basic', business: true, enterprise: true },
  { label: 'Analytics', starter: 'Basic', business: 'Advanced', enterprise: 'Custom' },
  { label: 'PWA', starter: true, business: true, enterprise: true },
  { label: 'Native Mobile Apps', starter: 'Employee', business: 'Employee + Worker + SAO', enterprise: 'Custom' },
  { label: 'RLS / Security', starter: true, business: true, enterprise: true },
  { label: 'Custom Features', starter: false, business: false, enterprise: true },
];

const FAQS = [
  {
    q: 'What is a company workspace?',
    a: 'A workspace is your company\u2019s own space in TMC Portal. It holds your users, sites, schedules, leave rules and records, and none of it is visible to other companies.',
  },
  {
    q: 'Can one company manage several sites?',
    a: 'Yes. Site admin officers can see and manage each location from the multi-site dashboard, and workers are assigned to the site where they work.',
  },
  {
    q: 'Who can see my employees\u2019 records?',
    a: 'Only people inside your workspace, and only what their role allows. Every sign-in is logged, so administrators can review activity.',
  },
  {
    q: 'How do workers clock in?',
    a: 'Workers and employees check in from their phones or on site. Their attendance shows up in their own portal and in the records for their site.',
  },
  {
    q: 'Can a group manage more than one company?',
    a: 'The Enterprise plan includes multiple company workspaces, so a group can run each of its companies separately.',
  },
  {
    q: 'How do I get started?',
    a: 'Create a workspace or book a demo using the form on this page. Your first administrator can then invite everyone else and assign their roles.',
  },
];

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
const WORKING_DAYS = 260;

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(null); // 'product' | 'solutions' | 'login' | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  const [featureTab, setFeatureTab] = useState(0);
  const [industryTab, setIndustryTab] = useState(0);

  const [calc, setCalc] = useState({ size: 100, wage: 700, rate: 2 });

  const [mode, setMode] = useState('workspace'); // 'workspace' | 'demo'
  const [plan, setPlan] = useState('business');
  const [form, setForm] = useState({ company: '', email: '', size: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'employee') navigate('/employee');
      else if (role === 'site_admin_officer') navigate('/sao');
      else if (role === 'encoder') navigate('/encoder');
      else if (role === 'worker') navigate('/worker');
    }
  }, [user, role, loading, navigate]);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    if (!openMenu && !mobileOpen) return;
    const onDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu, mobileOpen]);

  // Scroll-reveal motion: fade/slide elements with .tp-reveal (or .tp-reveal-zoom) into view once, on scroll.
  useEffect(() => {
    if (loading) return;
    const els = document.querySelectorAll('.tp-reveal, .tp-reveal-zoom');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  const toggleMenu = (name) => setOpenMenu((m) => (m === name ? null : name));
  const closeAll = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };
  const startWith = (nextMode) => {
    setMode(nextMode);
    setSubmitted(false);
    closeAll();
  };
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setCalcField = (key) => (e) => setCalc((c) => ({ ...c, [key]: Number(e.target.value) }));

  const handleRequest = (e) => {
    e.preventDefault();
    // TODO: send { mode, plan, ...form } to your sign-up / demo endpoint before showing the confirmation.
    setSubmitted(true);
  };

  const annualPayroll = calc.size * calc.wage * WORKING_DAYS;
  const annualLoss = annualPayroll * (calc.rate / 100);

  const group = FEATURE_GROUPS[featureTab];
  const industry = INDUSTRIES[industryTab];
  const IndustryIcon = industry.icon;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: 32, height: 32, color: '#f97316', animation: 'tp-spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#0b1f3a', fontFamily: 'DM Sans, sans-serif' }}>Establishing secure session...</p>
          <style>{`@keyframes tp-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap');

.tp-root {
  --white: #ffffff;
  --grey-50: #f4f5f7;
  --grey-200: #dfe2e7;
  --grey-500: #5f6673;
  --grey-700: #3f4652;
  --orange: #f97316;
  --orange-deep: #c2410c;
  --orange-tint: #fff1e6;
  --navy: #0b1f3a;
  --navy-soft: #14305a;
  --green: #16a34a;
  --green-deep: #15803d;
  --green-tint: #eafaf0;

  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.65;
  color: var(--grey-700);
  background: var(--white);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.tp-root *, .tp-root *::before, .tp-root *::after { box-sizing: border-box; }
.tp-root h1, .tp-root h2, .tp-root h3, .tp-root p, .tp-root ul, .tp-root ol { margin: 0; padding: 0; }
.tp-root ul, .tp-root ol { list-style: none; }
.tp-root a { color: inherit; text-decoration: none; }
.tp-root img { display: block; max-width: 100%; }
.tp-root button { font-family: inherit; }
html { scroll-behavior: smooth; }

.tp-root :focus-visible { outline: 3px solid var(--orange); outline-offset: 3px; border-radius: 6px; }

.tp-wrap { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 24px; }

/* ── TYPE SCALE ── */
.tp-h1, .tp-h2, .tp-h3 { font-family: 'Space Grotesk', sans-serif; color: var(--navy); }
.tp-h1 { font-size: clamp(2.5rem, 5.2vw, 4rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.035em; }
.tp-h2 { font-size: clamp(1.85rem, 3.3vw, 2.6rem); font-weight: 600; line-height: 1.12; letter-spacing: -0.03em; }
.tp-h3 { font-size: 1.05rem; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; }
.tp-measure { max-width: 54ch; }
.tp-section-head { max-width: 640px; margin-bottom: 44px; }
.tp-section-head.is-center { margin-left: auto; margin-right: auto; text-align: center; }
.tp-section-head .tp-h2 { margin-bottom: 14px; }
.tp-sec { scroll-margin-top: 72px; padding: 104px 0; }
.tp-sec.is-white { background: var(--white); }
.tp-sec.is-grey { background: var(--grey-50); }

/* ── BUTTONS ── */
.tp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 50px; padding: 0 26px;
  font-size: 0.95rem; font-weight: 600;
  border-radius: 10px; border: 1.5px solid transparent; cursor: pointer;
  transition: background-color .18s ease, border-color .18s ease, color .18s ease;
}
.tp-btn-primary { background: var(--orange); color: var(--navy); }
.tp-btn-primary:hover { background: #ff8a2e; }
.tp-btn-outline { background: transparent; color: var(--navy); border-color: var(--navy); }
.tp-btn-outline:hover { background: var(--navy); color: var(--white); }
.tp-btn-block { width: 100%; }
.tp-link-btn { background: none; border: none; padding: 0; cursor: pointer; font-size: inherit; font-weight: 600; color: var(--orange-deep); text-decoration: underline; text-underline-offset: 3px; }

/* ── NAVBAR ── */
.tp-nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.97); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); border-bottom: 1px solid var(--grey-200); }
.tp-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.tp-brand { display: flex; align-items: center; gap: 12px; }
.tp-brand img { height: 38px; width: auto; }
.tp-brand span { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.15rem; color: var(--navy); letter-spacing: -0.02em; }
.tp-nav-right { display: flex; align-items: center; gap: 28px; }
.tp-nav-links { display: flex; align-items: center; gap: 26px; }
.tp-nav-links > a, .tp-dd-btn { font-size: 0.95rem; font-weight: 500; color: var(--grey-700); padding: 6px 0; border: none; border-bottom: 2px solid transparent; background: none; cursor: pointer; transition: color .15s, border-color .15s; }
.tp-nav-links > a:hover, .tp-dd-btn:hover, .tp-dd-btn[aria-expanded="true"] { color: var(--navy); border-bottom-color: var(--orange); }
.tp-dd { position: relative; }
.tp-dd-btn { display: inline-flex; align-items: center; gap: 4px; }
.tp-dd-btn svg, .tp-login-btn svg { transition: transform .2s ease; }
.tp-dd-btn[aria-expanded="true"] svg, .tp-login-btn[aria-expanded="true"] svg { transform: rotate(180deg); }

.tp-nav-actions { display: flex; align-items: center; gap: 10px; }
.tp-nav-demo { font-size: 0.95rem; font-weight: 600; color: var(--navy); padding: 0 8px; }
.tp-nav-demo:hover { color: var(--orange-deep); }
.tp-login { position: relative; }
.tp-login-btn {
  display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 20px;
  background: transparent; color: var(--navy); border: 1.5px solid var(--navy); border-radius: 10px; cursor: pointer;
  font-size: 0.95rem; font-weight: 600; transition: background-color .18s ease, color .18s ease;
}
.tp-login-btn:hover, .tp-login-btn[aria-expanded="true"] { background: var(--navy); color: var(--white); }
.tp-nav-cta { height: 44px; padding: 0 20px; }
.tp-burger { display: none; width: 44px; height: 44px; align-items: center; justify-content: center; background: transparent; border: 1.5px solid var(--grey-200); border-radius: 10px; color: var(--navy); cursor: pointer; }

.tp-menu, .tp-mega {
  position: absolute; top: calc(100% + 14px);
  padding: 8px; background: var(--white); border: 1px solid var(--grey-200); border-radius: 14px;
  box-shadow: 0 18px 40px rgba(11,31,58,0.16);
  animation: tp-menu-in .16s ease-out both;
}
.tp-menu { right: 0; width: 300px; transform-origin: top right; }
.tp-mega { left: -24px; width: 560px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; transform-origin: top left; }
.tp-mega.is-single { grid-template-columns: 1fr; width: 340px; }
@keyframes tp-menu-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
.tp-menu-title { padding: 8px 12px 6px; font-size: 0.82rem; font-weight: 500; color: var(--grey-500); }
.tp-menu-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; transition: background-color .15s ease; }
.tp-menu-item:hover, .tp-menu-item:focus-visible { background: var(--orange-tint); }
.tp-menu-icon { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 9px; background: var(--grey-50); color: var(--navy); }
.tp-menu-item:hover .tp-menu-icon { background: var(--orange); }
.tp-menu-name { display: block; font-weight: 600; color: var(--navy); font-size: 0.95rem; line-height: 1.25; }
.tp-menu-sub { display: block; font-size: 0.8rem; color: var(--grey-500); line-height: 1.3; }

.tp-mobile { display: none; }

/* ── HERO ── */
.tp-hero { padding: 72px 0 96px; background: var(--white); }
.tp-hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 64px; align-items: center; }
.tp-hero-copy { animation: tp-hero-in .6s ease-out both; }
@keyframes tp-hero-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.tp-hero-copy .tp-h1 { margin-bottom: 22px; }
.tp-hero-copy p.tp-lead { font-size: 1.15rem; margin-bottom: 32px; }
.tp-hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 18px; }
.tp-hero-login { font-size: 0.92rem; color: var(--grey-500); margin-bottom: 28px; }
.tp-hero-checks { display: flex; flex-wrap: wrap; gap: 10px 26px; }
.tp-hero-checks li { display: flex; align-items: center; gap: 8px; font-size: 0.92rem; font-weight: 500; color: var(--grey-700); }
.tp-hero-checks svg { color: var(--orange-deep); flex-shrink: 0; }

.tp-hero-media { position: relative; }
.tp-hero-media::before {
  content: '';
  position: absolute; z-index: 0;
  right: -14%; top: -12%;
  width: 88%; height: 88%;
  background:
    radial-gradient(closest-side, rgba(249,115,22,0.55), rgba(249,115,22,0) 72%),
    radial-gradient(closest-side, rgba(255,138,46,0.35), rgba(255,138,46,0) 70%);
  background-repeat: no-repeat;
  background-position: 60% 35%, 30% 70%;
  background-size: 75% 75%, 60% 60%;
  filter: blur(46px);
  border-radius: 50%;
  pointer-events: none;
}
.tp-hero-photo { position: relative; z-index: 1; width: 100%; display: flex; align-items: center; justify-content: center; padding: 28px 0 40px; }
.tp-hero-photo img { width: 100%; height: auto; max-height: 560px; object-fit: contain; filter: drop-shadow(0 24px 40px rgba(11,31,58,0.28)); }
.tp-hero-tag { position: absolute; z-index: 2; left: -12px; bottom: -8px; max-width: 320px; display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 14px; background: var(--white); border: 1px solid var(--grey-200); box-shadow: 0 18px 40px rgba(11,31,58,0.16); color: var(--navy); font-size: 0.9rem; line-height: 1.4; }
.tp-hero-tag strong { font-family: 'Space Grotesk', sans-serif; font-weight: 600; display: block; font-size: 1rem; }
.tp-hero-tag svg { flex-shrink: 0; color: var(--orange-deep); }

/* ── APPS + PORTALS ── */
.tp-apps { background: var(--grey-50); border-top: 1px solid var(--grey-200); border-bottom: 1px solid var(--grey-200); padding: 72px 0; }
.tp-apps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
.tp-apps-media img {
  width: 100%;
  height: auto;
  display: block;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
}
.tp-apps-copy .tp-h2 { margin-bottom: 14px; }
.tp-apps-copy p { margin-bottom: 24px; }
.tp-apps-list { border-top: 1px solid var(--grey-200); }
.tp-apps-list li { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--grey-200); font-weight: 600; color: var(--navy); font-size: 0.97rem; }
.tp-apps-list li svg { color: var(--orange-deep); flex-shrink: 0; }

/* ── TABS (features + industries) ── */
.tp-tabs { display: flex; gap: 6px; margin-bottom: 44px; border-bottom: 1px solid var(--grey-200); overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tp-tab { flex-shrink: 0; padding: 14px 20px; background: none; border: none; border-bottom: 3px solid transparent; margin-bottom: -1px; font-size: 0.98rem; font-weight: 600; color: var(--grey-500); cursor: pointer; white-space: nowrap; transition: color .15s, border-color .15s; }
.tp-tab:hover { color: var(--navy); }
.tp-tab[aria-selected="true"] { color: var(--navy); border-bottom-color: var(--orange); }

.tp-feat-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 64px; align-items: center; }
.tp-feat-list { border-top: 1px solid var(--grey-200); }
.tp-feat-item { display: flex; gap: 14px; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid var(--grey-200); }
.tp-feat-item svg { color: var(--orange-deep); flex-shrink: 0; margin-top: 4px; }
.tp-feat-item strong { display: block; font-weight: 600; color: var(--navy); line-height: 1.35; }
.tp-feat-item span { display: block; font-size: 0.93rem; color: var(--grey-500); line-height: 1.5; }

.tp-feat-media img { width: 100%; height: auto; display: block; }

/* ── INDUSTRY PANEL ── */
.tp-ind-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
.tp-ind-copy .tp-h2 { margin-bottom: 22px; }
.tp-ind-list { margin-bottom: 30px; }
.tp-ind-list li { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 1.02rem; color: var(--navy); font-weight: 500; }
.tp-ind-list svg { color: var(--orange-deep); flex-shrink: 0; margin-top: 5px; }
.tp-ind-media {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}

.tp-ind-media img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 24px;
}

.tp-ind-media::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 35%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(255, 255, 255, 0.35) 45%,
    rgba(255, 255, 255, 0.95) 100%
  );
  pointer-events: none;
}

/* ── WORKSPACES (multi-tenant) ── */
.tp-workspaces-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; text-align: center; }
.tp-ws-points { margin-top: 36px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 980px; margin-left: auto; margin-right: auto; }
.tp-ws-point { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 30px 22px; text-align: center; background: var(--white); border: 1px solid var(--grey-200); border-radius: 18px; }
.tp-ws-icon { width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--green-tint); color: var(--green-deep); }
.tp-ws-point strong { display: block; font-weight: 600; color: var(--navy); line-height: 1.35; }
.tp-ws-point span { display: block; font-size: 0.93rem; color: var(--grey-500); line-height: 1.5; }
.tp-ws-media { max-width: 1100px; margin: 8px auto 0; width: 100%; }
.tp-ws-media img { width: 100%; height: auto; display: block; }

/* ── HOW IT WORKS ── */
.tp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.tp-step { position: relative; text-align: center; display: flex; flex-direction: column; align-items: center; padding: 36px 28px; background: transparent; border: 1px solid var(--grey-200); border-radius: 18px; }
.tp-step-icon { width: 48px; height: 48px; border-radius: 50%; margin-bottom: 18px; display: flex; align-items: center; justify-content: center; background: var(--green-tint); color: var(--green-deep); }
.tp-step .tp-h3 { margin-bottom: 8px; }
.tp-step p { font-size: 0.95rem; color: var(--grey-500); line-height: 1.6; }

/* ── PILLARS (navy) ── */
.tp-pillars { background: var(--navy); color: #c9d3e3; }
.tp-pillars .tp-h2 { color: var(--white); }
.tp-pillars .tp-section-head p { color: #c9d3e3; }
.tp-pillars-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.tp-pillar { text-align: center; display: flex; flex-direction: column; align-items: center; padding: 32px 26px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; }
.tp-pillar-icon { width: 48px; height: 48px; border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; background: rgba(22,163,74,0.18); color: var(--green); }
.tp-pillar .tp-h3 { color: var(--white); font-size: 1.2rem; margin-bottom: 10px; }
.tp-pillar p { font-size: 0.97rem; line-height: 1.65; color: #b6c2d6; }

/* ── CALCULATOR ── */
.tp-calc-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; align-items: stretch; }
.tp-calc-card { background: var(--white); border: 1px solid var(--grey-200); border-radius: 22px; padding: 36px; }
.tp-calc-row + .tp-calc-row { margin-top: 30px; }
.tp-calc-top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
.tp-calc-top label { font-weight: 600; color: var(--navy); }
.tp-calc-top output { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 1.15rem; color: var(--navy); }
.tp-calc-card input[type="range"] { width: 100%; height: 6px; accent-color: var(--orange); cursor: pointer; }
.tp-calc-scale { display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.8rem; color: var(--grey-500); }
.tp-calc-note { margin-top: 26px; padding-top: 18px; border-top: 1px solid var(--grey-200); font-size: 0.88rem; color: var(--grey-500); }
.tp-calc-result { display: flex; flex-direction: column; justify-content: center; background: var(--navy); color: #c9d3e3; border-radius: 22px; padding: 44px; }
.tp-calc-result p.tp-calc-label { font-size: 0.95rem; margin-bottom: 8px; }
.tp-calc-figure { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: clamp(2.2rem, 4.2vw, 3.2rem); line-height: 1.05; letter-spacing: -0.03em; color: var(--white); margin-bottom: 10px; overflow-wrap: anywhere; }
.tp-calc-month { font-size: 1rem; color: var(--orange); font-weight: 600; margin-bottom: 30px; }
.tp-calc-result .tp-btn { align-self: flex-start; }

/* ── ROLE SECTIONS (alternating stories) ── */
.tp-portals-intro { background: var(--white); padding: 104px 0 0; scroll-margin-top: 72px; }
.tp-role { padding: 104px 0; scroll-margin-top: 72px; }
.tp-role.is-white { background: var(--white); }
.tp-role.is-grey  { background: var(--grey-50); }
.tp-portals-intro + .tp-role { padding-top: 64px; }
.tp-role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
.tp-role.is-flip .tp-role-media { order: 2; }
.tp-role.is-flip .tp-role-copy  { order: 1; }
.tp-role-media { position: relative; }
.tp-role-media::before { content: ''; position: absolute; z-index: 0; top: -14px; left: -14px; width: 46%; height: 46%;  }
.tp-role.is-flip .tp-role-media::before { left: auto; right: -14px; border-left: none;  }
.tp-role-frame { position: relative; z-index: 1; }
.tp-role-frame img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.tp-level { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: var(--orange-tint); color: var(--orange-deep); font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; }
.tp-role-copy .tp-h2 { margin-bottom: 10px; }
.tp-role-lead { font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; font-weight: 500; letter-spacing: -0.01em; color: var(--navy); margin-bottom: 14px; line-height: 1.4; }
.tp-role-desc { margin-bottom: 28px; }
.tp-features { margin-bottom: 34px; border-top: 1px solid var(--grey-200); }
.tp-feature { display: flex; gap: 16px; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid var(--grey-200); }
.tp-feature-icon { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--green-tint); color: var(--green-deep); }
.tp-feature-title { display: block; font-weight: 600; color: var(--navy); line-height: 1.35; }
.tp-feature-sub { display: block; font-size: 0.92rem; color: var(--grey-500); line-height: 1.45; }
.tp-role-actions { display: flex; flex-wrap: wrap; gap: 14px; }

/* ── PRICING ── */
.tp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; }
.tp-plan { display: flex; flex-direction: column; padding: 32px; background: var(--white); border: 1px solid var(--grey-200); border-radius: 20px; }
.tp-plan.is-featured { border: 2px solid var(--navy); position: relative; }
.tp-plan-badge { position: absolute; top: -14px; left: 32px; padding: 4px 14px; border-radius: 999px; background: var(--orange); color: var(--navy); font-size: 0.8rem; font-weight: 600; }
.tp-plan .tp-h3 { font-size: 1.3rem; margin-bottom: 4px; }
.tp-plan-for { font-size: 0.95rem; color: var(--grey-500); margin-bottom: 22px; line-height: 1.5; }
.tp-plan-price { padding: 16px 0; margin-bottom: 20px; border-top: 1px solid var(--grey-200); border-bottom: 1px solid var(--grey-200); }
.tp-plan-price-amount { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.6rem; color: var(--navy); letter-spacing: -0.02em; }
.tp-plan-price-suffix { display: block; font-size: 0.85rem; color: var(--grey-500); margin-top: 4px; font-weight: 500; }
.tp-plan-price-note { display: block; font-size: 0.82rem; color: var(--grey-500); margin-top: 8px; line-height: 1.4; }
.tp-plan ul { flex: 1; margin-bottom: 28px; }
.tp-plan li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.95rem; line-height: 1.5; }
.tp-plan li + li { margin-top: 12px; }
.tp-plan li svg { color: var(--orange-deep); flex-shrink: 0; margin-top: 3px; }

/* ── PLAN COMPARISON TABLE ── */
.tp-compare-wrap { margin-top: 64px; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--grey-200); border-radius: 18px; background: var(--white); }
.tp-compare { width: 100%; min-width: 640px; border-collapse: collapse; }
.tp-compare caption { text-align: left; padding: 22px 24px 0; font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 1.1rem; color: var(--navy); }
.tp-compare th, .tp-compare td { padding: 14px 20px; text-align: center; font-size: 0.92rem; border-bottom: 1px solid var(--grey-200); }
.tp-compare thead th { font-family: 'Space Grotesk', sans-serif; font-weight: 600; color: var(--navy); font-size: 0.98rem; padding-top: 20px; }
.tp-compare th:first-child, .tp-compare td:first-child { text-align: left; font-weight: 600; color: var(--navy); position: sticky; left: 0; background: var(--white); }
.tp-compare tbody tr:last-child td { border-bottom: none; }
.tp-compare tbody tr:hover td { background: var(--grey-50); }
.tp-compare tbody tr:hover td:first-child { background: var(--grey-50); }
.tp-compare-yes { color: var(--green-deep); }
.tp-compare-no { color: var(--grey-500); opacity: 0.6; }
.tp-compare-col-featured { background: var(--orange-tint); }

/* ── FAQ ── */
.tp-faq-grid { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 72px; align-items: start; }
.tp-faq-item { border-bottom: 1px solid var(--grey-200); }
.tp-faq-item:first-child { border-top: 1px solid var(--grey-200); }
.tp-faq-item summary { list-style: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 0; font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 1.08rem; color: var(--navy); letter-spacing: -0.01em; }
.tp-faq-item summary::-webkit-details-marker { display: none; }
.tp-faq-item summary::after { content: '+'; flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--grey-50); border: 1px solid var(--grey-200); font-size: 1.25rem; font-weight: 500; line-height: 1; color: var(--navy); }
.tp-faq-item[open] summary::after { content: '\\2212'; background: var(--orange); border-color: var(--orange); }
.tp-faq-item p { padding: 0 52px 22px 0; color: var(--grey-700); }

/* ── START (workspace / demo form) ── */
.tp-eyebrow { display: inline-block; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--orange-deep); margin-bottom: 16px; }
.tp-start-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 80px; align-items: start; }
.tp-start-intro .tp-h2 { margin-bottom: 14px; }
.tp-start-intro p { margin-bottom: 30px; }
.tp-start-points { margin-bottom: 0; border-top: 1px solid var(--grey-200); }
.tp-start-points li { display: flex; gap: 12px; align-items: flex-start; padding: 15px 0; border-bottom: 1px solid var(--grey-200); font-size: 0.95rem; color: var(--navy); font-weight: 500; }
.tp-start-points svg { color: var(--orange-deep); flex-shrink: 0; margin-top: 3px; }
.tp-start-panel { padding-left: 56px; border-left: 1px solid var(--grey-200); }
.tp-seg { display: inline-flex; gap: 28px; margin-bottom: 30px; border-bottom: 1px solid var(--grey-200); }
.tp-seg button { position: relative; height: 42px; padding: 0 2px; border: none; background: transparent; font-size: 0.98rem; font-weight: 600; color: var(--grey-500); cursor: pointer; transition: color .15s; }
.tp-seg button:hover { color: var(--navy); }
.tp-seg button[aria-pressed="true"] { color: var(--navy); }
.tp-seg button[aria-pressed="true"]::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--orange); }
.tp-field { margin-bottom: 20px; }
.tp-field label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--grey-500); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
.tp-field input, .tp-field select {
  width: 100%; height: 44px; padding: 0 2px;
  font-family: 'DM Sans', sans-serif; font-size: 1rem; color: var(--navy);
  background: transparent; border: none; border-bottom: 1.5px solid var(--grey-200);
  border-radius: 0; transition: border-color .15s ease;
}
.tp-field input:hover, .tp-field select:hover { border-bottom-color: #b8bfcc; }
.tp-field input:focus, .tp-field select:focus { outline: none; border-bottom-color: var(--orange); }
.tp-start-panel .tp-btn { margin-top: 8px; }
.tp-form-note { margin-top: 16px; font-size: 0.85rem; color: var(--grey-500); }
.tp-done { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
.tp-done-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--orange-tint); color: var(--orange-deep); }

/* ── FOOTER ── */
.tp-footer { background: var(--navy); color: #b6c2d6; padding: 48px 0 24px; }
.tp-footer-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 32px; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.12); }
.tp-footer-logo { display: inline-flex; align-items: center; gap: 10px; padding: 6px 12px 6px 8px; background: var(--white); border-radius: 8px; margin-bottom: 14px; }
.tp-footer-logo img { height: 24px; width: auto; }
.tp-footer-logo span { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 0.92rem; color: var(--navy); }
.tp-footer p { font-size: 0.88rem; max-width: 36ch; line-height: 1.55; color: #a3b0c7; }
.tp-footer h3 { font-family: 'Space Grotesk', sans-serif; color: var(--white); font-size: 0.88rem; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 12px; }
.tp-footer li + li { margin-top: 8px; }
.tp-footer li a, .tp-footer li button { font-size: 0.88rem; color: inherit; background: none; border: none; padding: 0; cursor: pointer; text-align: left; transition: color .15s; }
.tp-footer li a:hover, .tp-footer li button:hover { color: var(--orange); }
.tp-footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; padding-top: 18px; font-size: 0.8rem; color: #8a99b3; }

/* ── TOP PROMO BAR ── */
.tp-topbar {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, var(--navy) 0%, var(--navy-soft) 50%, var(--navy) 100%);
  background-size: 200% 100%;
  animation: tp-topbar-sheen 8s ease-in-out infinite;
  color: var(--white);
}
.tp-topbar-inner { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 24px; text-align: center; flex-wrap: wrap; }
.tp-topbar-badge {
  display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
  border-radius: 999px; background: var(--orange); color: var(--navy);
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  animation: tp-pulse 2.2s ease-in-out infinite;
}
.tp-topbar-text { font-size: 0.88rem; font-weight: 500; color: #e7ecf6; }
.tp-topbar-text strong { color: var(--white); font-weight: 700; }
.tp-topbar-cta { font-size: 0.85rem; font-weight: 700; color: var(--orange); text-decoration: underline; text-underline-offset: 3px; transition: color .15s ease, transform .15s ease; display: inline-block; }
.tp-topbar-cta:hover { color: #ffb066; transform: translateX(2px); }
@keyframes tp-topbar-sheen { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes tp-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,0.5); } 50% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(249,115,22,0); } }

/* ── SCROLL-REVEAL MOTION ── */
.tp-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); will-change: opacity, transform; }
.tp-reveal.is-visible { opacity: 1; transform: none; }
.tp-reveal-delay-1.is-visible { transition-delay: .08s; }
.tp-reveal-delay-2.is-visible { transition-delay: .16s; }
.tp-reveal-delay-3.is-visible { transition-delay: .24s; }
.tp-reveal-delay-4.is-visible { transition-delay: .32s; }
.tp-reveal-zoom { opacity: 0; transform: scale(0.94); transition: opacity .7s ease, transform .7s ease; }
.tp-reveal-zoom.is-visible { opacity: 1; transform: none; }

/* ── HOVER MOTION EFFECTS ── */
.tp-btn { transition: background-color .18s ease, border-color .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease; }
.tp-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(11,31,58,0.16); }
.tp-btn:active { transform: translateY(0); box-shadow: none; }

.tp-menu-item { transition: background-color .15s ease, transform .15s ease; }
.tp-menu-item:hover { transform: translateX(3px); }

.tp-ws-point, .tp-step, .tp-pillar, .tp-plan { transition: transform .25s ease, box-shadow .25s ease; }
.tp-ws-point:hover, .tp-step:hover { transform: translateY(-6px); box-shadow: 0 16px 30px rgba(11,31,58,0.10); }
.tp-pillar:hover { transform: translateY(-6px); background: rgba(255,255,255,0.07); }
.tp-plan:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(11,31,58,0.14); }
.tp-plan.is-featured:hover { transform: translateY(-10px); }

.tp-apps-media img, .tp-feat-media img, .tp-ind-media img, .tp-ws-media img, .tp-role-frame img {
  transition: transform .5s cubic-bezier(.22,.61,.36,1);
}
.tp-apps-media:hover img { transform: scale(1.03); }
.tp-feat-media:hover img { transform: scale(1.03); }
.tp-ind-media:hover img { transform: scale(1.05); }
.tp-role-frame:hover img { transform: scale(1.04); }

.tp-hero-photo img { transition: transform .5s ease; }
.tp-hero-photo:hover img { transform: translateY(-6px) scale(1.01); }

.tp-tab { transition: color .15s, border-color .15s, transform .15s; }
.tp-tab:hover { transform: translateY(-1px); }

.tp-faq-item summary { transition: color .15s ease; }
.tp-faq-item summary:hover { color: var(--orange-deep); }
.tp-faq-item summary::after { transition: background-color .2s ease, border-color .2s ease, transform .3s ease; }
.tp-faq-item[open] summary::after { transform: rotate(180deg); }

.tp-level, .tp-plan-badge, .tp-eyebrow { transition: transform .2s ease; }

.tp-footer li a, .tp-footer li button { transition: color .15s ease, transform .15s ease; display: inline-block; }
.tp-footer li a:hover, .tp-footer li button:hover { transform: translateX(3px); }

@media (max-width: 640px) {
  .tp-topbar-inner { padding: 9px 16px; font-size: 0.8rem; }
}

/* ── RESPONSIVE ── */
@media (max-width: 1160px) { .tp-nav-demo { display: none; } }
@media (max-width: 1000px) {
  .tp-nav-links { display: none; }
  .tp-burger { display: inline-flex; }
  .tp-mobile { display: block; position: absolute; top: 100%; left: 0; right: 0; background: var(--white); border-bottom: 1px solid var(--grey-200); box-shadow: 0 18px 30px rgba(11,31,58,0.10); padding: 8px 24px 24px; max-height: calc(100vh - 72px); overflow-y: auto; }
  .tp-mobile a.tp-mobile-link { display: block; padding: 14px 0; font-weight: 600; color: var(--navy); border-bottom: 1px solid var(--grey-200); }
  .tp-mobile .tp-btn { margin-top: 18px; }
  .tp-hero-grid, .tp-feat-grid, .tp-ind-grid, .tp-calc-grid, .tp-faq-grid, .tp-apps-grid { grid-template-columns: 1fr; gap: 48px; }
  .tp-hero-photo img { max-height: 440px; }
  .tp-hero-media::before { right: -12px; bottom: -12px; }
  .tp-hero-tag { left: 0; }
  .tp-steps, .tp-pillars-list, .tp-ws-points { grid-template-columns: 1fr; gap: 20px; }
  .tp-role-grid { grid-template-columns: 1fr; gap: 48px; }
  .tp-role.is-flip .tp-role-media, .tp-role.is-flip .tp-role-copy { order: initial; }
  .tp-role.is-flip .tp-role-media::before { left: -14px; right: auto; border-right: none; border-left: 4px solid var(--orange); border-top-right-radius: 0; border-top-left-radius: 22px; }
  .tp-plans { grid-template-columns: 1fr; max-width: 520px; }
  .tp-start-grid { grid-template-columns: 1fr; gap: 40px; }
  .tp-start-panel { padding-left: 0; border-left: none; padding-top: 32px; border-top: 1px solid var(--grey-200); }
  .tp-footer-grid { grid-template-columns: 1fr 1fr; }
  .tp-footer-grid > div:first-child { grid-column: 1 / -1; }
}
@media (max-width: 760px) {
  .tp-hero { padding: 44px 0 72px; }
  .tp-sec, .tp-role { padding: 72px 0; }
  .tp-apps { padding: 48px 0; }
  .tp-portals-intro { padding: 72px 0 0; }
  .tp-portals-intro + .tp-role { padding-top: 48px; }
  .tp-calc-result, .tp-ind-card { padding: 32px 24px; }
  .tp-calc-card { padding: 28px 22px; }
  .tp-faq-item p { padding-right: 0; }
}
@media (max-width: 520px) {
  .tp-wrap { padding: 0 18px; }
  .tp-brand span { display: none; }
  .tp-nav-cta { display: none; }
  .tp-mobile { padding: 8px 18px 24px; }
  .tp-menu { right: -8px; width: min(300px, calc(100vw - 32px)); }
  .tp-hero-actions .tp-btn { width: 100%; }
  .tp-footer-grid { grid-template-columns: 1fr; gap: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .tp-hero-copy, .tp-menu, .tp-mega, .tp-topbar, .tp-topbar-badge { animation: none; }
  .tp-root * { transition: none !important; }
  .tp-reveal, .tp-reveal-zoom { opacity: 1 !important; transform: none !important; }
}
      `}</style>

      <div className="tp-root">
        {/* ═════════ TOP PROMO BAR ═════════ */}
        <div className="tp-topbar" role="note" aria-label="Promotion">
          <div className="tp-topbar-inner">
            <span className="tp-topbar-badge">Available now</span>
            <span className="tp-topbar-text">
              TMC Portal is live — try every portal free with a <strong>7-day trial</strong>, no card required.
            </span>
            <a href="#start" className="tp-topbar-cta" onClick={() => startWith('workspace')}>
              Start your free trial →
            </a>
          </div>
        </div>

        {/* ═════════ NAVBAR ═════════ */}
        <header className="tp-nav" ref={navRef}>
          <div className="tp-wrap tp-nav-inner">
            <a href="#top" className="tp-brand" aria-label="TMC Portal home">
              <img src="/TMClog0s.png" alt="" />
              
            </a>

            <div className="tp-nav-right">
              <nav className="tp-nav-links" aria-label="Main">
                <div className="tp-dd">
                  <button type="button" className="tp-dd-btn" aria-haspopup="true" aria-expanded={openMenu === 'product'} onClick={() => toggleMenu('product')}>
                    Product <ChevronDown size={15} aria-hidden="true" />
                  </button>
                  {openMenu === 'product' && (
                    <div className="tp-mega">
                      {FEATURE_GROUPS.map((g, i) => {
                        const Icon = g.icon;
                        return (
                          <a key={g.id} href="#features" className="tp-menu-item" onClick={() => { setFeatureTab(i); closeAll(); }}>
                            <span className="tp-menu-icon"><Icon size={18} aria-hidden="true" /></span>
                            <span>
                              <span className="tp-menu-name">{g.label}</span>
                              <span className="tp-menu-sub">{g.menuSub}</span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="tp-dd">
                  <button type="button" className="tp-dd-btn" aria-haspopup="true" aria-expanded={openMenu === 'solutions'} onClick={() => toggleMenu('solutions')}>
                    Solutions <ChevronDown size={15} aria-hidden="true" />
                  </button>
                  {openMenu === 'solutions' && (
                    <div className="tp-mega is-single">
                      {INDUSTRIES.map((ind, i) => {
                        const Icon = ind.icon;
                        return (
                          <a key={ind.id} href="#solutions" className="tp-menu-item" onClick={() => { setIndustryTab(i); closeAll(); }}>
                            <span className="tp-menu-icon"><Icon size={18} aria-hidden="true" /></span>
                            <span>
                              <span className="tp-menu-name">{ind.label}</span>
                              <span className="tp-menu-sub">{ind.menuSub}</span>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                <a href="#workspaces">Workspaces</a>
                <a href="#portals">Portals</a>
                <a href="#pricing">Pricing</a>
              </nav>

              <div className="tp-nav-actions">
                <div className="tp-login">
                  <button
                    type="button"
                    className="tp-login-btn"
                    aria-haspopup="menu"
                    aria-expanded={openMenu === 'login'}
                    aria-controls="tp-login-menu"
                    onClick={() => toggleMenu('login')}
                  >
                    Login
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>

                  {openMenu === 'login' && (
                    <div className="tp-menu" id="tp-login-menu" role="menu">
                      <p className="tp-menu-title">Log in as</p>
                      {PORTALS.map((p) => {
                        const Icon = p.icon;
                        return (
                          <Link key={p.id} to={p.to} role="menuitem" className="tp-menu-item" onClick={closeAll}>
                            <span className="tp-menu-icon"><Icon size={18} aria-hidden="true" /></span>
                            <span>
                              <span className="tp-menu-name">{p.menuLabel}</span>
                              <span className="tp-menu-sub">{p.menuSub}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

             
                <a href="#start" className="tp-btn tp-btn-primary tp-nav-cta" onClick={() => startWith('workspace')}>Get started</a>

                <button
                  type="button"
                  className="tp-burger"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                  onClick={() => { setOpenMenu(null); setMobileOpen((o) => !o); }}
                >
                  {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>

          {mobileOpen && (
            <nav className="tp-mobile" aria-label="Mobile">
              <a className="tp-mobile-link" href="#features" onClick={closeAll}>Product</a>
              <a className="tp-mobile-link" href="#solutions" onClick={closeAll}>Solutions</a>
              <a className="tp-mobile-link" href="#workspaces" onClick={closeAll}>Workspaces</a>
              <a className="tp-mobile-link" href="#portals" onClick={closeAll}>Portals</a>
              <a className="tp-mobile-link" href="#pricing" onClick={closeAll}>Pricing</a>
              <a className="tp-mobile-link" href="#faq" onClick={closeAll}>FAQ</a>
              <a href="#start" className="tp-btn tp-btn-primary tp-btn-block" onClick={() => startWith('workspace')}>Get started</a>
            </nav>
          )}
        </header>

        <main id="top">
          {/* ═════════ HERO ═════════ */}
          <section className="tp-hero" aria-labelledby="hero-title">
            <div className="tp-wrap tp-hero-grid">
              <div className="tp-hero-copy">
                <h1 className="tp-h1" id="hero-title">Attendance, payroll and site teams in one workspace.</h1>
                <p className="tp-lead tp-measure">
                  TMC Portal gives every company its own secure workspace, with a portal for each role: administrators,
                  site officers, employees, encoders and field workers.
                </p>
                <div className="tp-hero-actions">
                  <a href="#start" className="tp-btn tp-btn-primary" onClick={() => startWith('workspace')}>
                    Create your workspace
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a href="#start" className="tp-btn tp-btn-outline" onClick={() => startWith('demo')}>Book a demo</a>
                </div>
                <p className="tp-hero-login">
                  Already have a workspace?{' '}
                  <button type="button" className="tp-link-btn" onClick={() => setOpenMenu('login')} aria-haspopup="menu">Log in</button>
                </p>
                <ul className="tp-hero-checks">
                  <li><Check size={16} aria-hidden="true" />A separate workspace per company</li>
                  <li><Check size={16} aria-hidden="true" />Five role-based portals</li>
                  <li><Check size={16} aria-hidden="true" />Clock-in to payslip</li>
                </ul>
              </div>

              <div className="tp-hero-media">
                <div className="tp-hero-photo">
                  <img src={heroGadget} alt="TMC Portal running on a phone and other devices" />
                </div>
                
              </div>
            </div>
          </section>

          {/* ═════════ APPS + PORTALS ═════════ */}
          <section className="tp-apps" aria-label="Apps and portals">
            <div className="tp-wrap tp-apps-grid">
              <div className="tp-apps-media tp-reveal-zoom">
                <img src={modelAppsImage} alt="TMC Portal apps running on mobile devices" />
              </div>

              <div className="tp-apps-copy tp-reveal">
                <h2 className="tp-h2">Three mobile apps, one web app, five portals</h2>
                <p className="tp-measure">
                  Give your field teams an app built for their role, and give your office a full web app
                  covering every level of access.
                </p>
                <ul className="tp-apps-list">
                  <li><Smartphone size={20} aria-hidden="true" />Employee app — attendance, leave and records</li>
                  <li><Smartphone size={20} aria-hidden="true" />Site Officer app — manage sites and workers</li>
                  <li><Smartphone size={20} aria-hidden="true" />Worker app — clock-in, shifts and payslips</li>
                  <li><Laptop size={20} aria-hidden="true" />Web app with 5 portals: Administrator, Site Admin Officer, Employee, Encoder and Worker</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ═════════ FEATURES (tabs) ═════════ */}
          <section className="tp-sec is-white" id="features" aria-labelledby="features-title">
            <div className="tp-wrap">
              <div className="tp-section-head tp-reveal">
                <h2 className="tp-h2" id="features-title">Everything from clock-in to payslip</h2>
                <p>Pick an area of the system to see what it covers. The same records feed every portal, so nobody enters the same information twice.</p>
              </div>

              <div className="tp-tabs" role="tablist" aria-label="Feature areas">
                {FEATURE_GROUPS.map((g, i) => (
                  <button
                    key={g.id}
                    type="button"
                    role="tab"
                    id={`ftab-${g.id}`}
                    aria-selected={featureTab === i}
                    aria-controls="ftab-panel"
                    className="tp-tab"
                    onClick={() => setFeatureTab(i)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <div className="tp-feat-grid tp-reveal" role="tabpanel" id="ftab-panel" aria-labelledby={`ftab-${group.id}`}>
                <ul className="tp-feat-list">
                  {group.items.map((it) => (
                    <li className="tp-feat-item" key={it.title}>
                      <Check size={18} aria-hidden="true" />
                      <div>
                        <strong>{it.title}</strong>
                        <span>{it.text}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="tp-feat-media">
                  <img src={group.image} alt={`${group.label} preview`} />
                </div>
              </div>
            </div>
          </section>

          {/* ═════════ SOLUTIONS (industry tabs) ═════════ */}
          <section className="tp-sec is-grey" id="solutions" aria-labelledby="solutions-title">
            <div className="tp-wrap">
              <div className="tp-section-head tp-reveal">
                <h2 className="tp-h2" id="solutions-title">One platform for every kind of site</h2>
                <p>See how the portals fit the way your industry actually works.</p>
              </div>

              <div className="tp-tabs" role="tablist" aria-label="Industries">
                {INDUSTRIES.map((ind, i) => (
                  <button
                    key={ind.id}
                    type="button"
                    role="tab"
                    id={`itab-${ind.id}`}
                    aria-selected={industryTab === i}
                    aria-controls="itab-panel"
                    className="tp-tab"
                    onClick={() => setIndustryTab(i)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>

              <div className="tp-ind-grid tp-reveal" role="tabpanel" id="itab-panel" aria-labelledby={`itab-${industry.id}`}>
                <div className="tp-ind-copy">
                  <h3 className="tp-h2">{industry.headline}</h3>
                  <ul className="tp-ind-list">
                    {industry.bullets.map((b) => (
                      <li key={b}><Check size={18} aria-hidden="true" />{b}</li>
                    ))}
                  </ul>
                  <a href="#start" className="tp-btn tp-btn-primary" onClick={() => startWith('workspace')}>
                    Get started
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                </div>

                <div className="tp-ind-media">
                  <img src={industry.image} alt={industry.imageAlt} />
                </div>
              </div>
            </div>
          </section>

          {/* ═════════ WORKSPACES (multi-tenant) ═════════ */}
          <section className="tp-sec is-white" id="workspaces" aria-labelledby="workspaces-title">
            <div className="tp-wrap tp-workspaces-grid">
              <div className="tp-reveal">
                <h2 className="tp-h2" id="workspaces-title">One platform, a separate workspace for every company</h2>
                <p className="tp-measure" style={{ marginTop: 14, marginLeft: 'auto', marginRight: 'auto' }}>
                  Sign up your company and start using TMC Portal without setting up any servers. Your data is kept
                  apart from every other company on the platform.
                </p>
                <ul className="tp-ws-points">
                  {WORKSPACE_POINTS.map((w) => {
                    return (
                      <li className="tp-ws-point" key={w.title}>
                        <span className="tp-ws-icon"><Check size={22} aria-hidden="true" /></span>
                        <div>
                          <strong>{w.title}</strong>
                          <span>{w.text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="tp-ws-media tp-reveal-zoom">
                <img src={modelAppsImage7} alt="TMC Portal workspaces preview" />
              </div>
            </div>
          </section>

          {/* ═════════ HOW IT WORKS ═════════ */}
          <section className="tp-sec is-grey" aria-labelledby="steps-title">
            <div className="tp-wrap">
              <div className="tp-section-head is-center">
                <h2 className="tp-h2" id="steps-title">Up and running in three steps</h2>
                <p>You do not need an IT team to start. Set up the workspace, add your people, and go.</p>
              </div>
              <ol className="tp-steps tp-reveal">
                {STEPS.map((s) => {
                  return (
                    <li className="tp-step" key={s.title}>
                      <div className="tp-step-icon"><Check size={20} aria-hidden="true" /></div>
                      <h3 className="tp-h3">{s.title}</h3>
                      <p>{s.text}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* ═════════ PILLARS ═════════ */}
          <section className="tp-sec tp-pillars" aria-labelledby="pillars-title">
            <div className="tp-wrap">
              <div className="tp-section-head is-center">
                <h2 className="tp-h2" id="pillars-title">Built for accuracy and control</h2>
                <p>Get attendance right at the source, pay people correctly, and stay ready for audits.</p>
              </div>
              <ul className="tp-pillars-list tp-reveal">
                {PILLARS.map((p) => {
                  return (
                    <li className="tp-pillar" key={p.title}>
                      <div className="tp-pillar-icon"><Check size={22} aria-hidden="true" /></div>
                      <h3 className="tp-h3">{p.title}</h3>
                      <p>{p.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

      

          {/* ═════════ ROLE PORTALS ═════════ */}
          <section className="tp-portals-intro" id="portals" aria-labelledby="portals-title">
            <div className="tp-wrap">
              <div className="tp-section-head" style={{ marginBottom: 0 }}>
                <h2 className="tp-h2" id="portals-title">A portal for every role in your company</h2>
                <p>Each person signs in to the portal that fits their job and sees only what that role needs.</p>
              </div>
            </div>
          </section>

          {PORTALS.map((p, i) => {
            const flip = i % 2 === 1;
            const Icon = p.icon;
            return (
              <section
                key={p.id}
                id={p.id}
                className={`tp-role ${i % 2 === 0 ? 'is-white' : 'is-grey'}${flip ? ' is-flip' : ''}`}
                aria-labelledby={`${p.id}-title`}
              >
                <div className="tp-wrap tp-role-grid">
                  <div className="tp-role-media tp-reveal-zoom">
                    <div className="tp-role-frame">
                      <img src={p.image} alt={p.imageAlt} loading="lazy" />
                    </div>
                  </div>

                  <div className="tp-role-copy tp-reveal">
                    <span className="tp-level">
                      <Icon size={16} aria-hidden="true" />
                      {p.level}
                    </span>
                    <h2 className="tp-h2" id={`${p.id}-title`}>{p.title}</h2>
                    <p className="tp-role-lead">{p.lead}</p>
                    <p className="tp-role-desc tp-measure">{p.description}</p>

                    <ul className="tp-features">
                      {p.features.map((f) => {
                        return (
                          <li className="tp-feature" key={f.title}>
                            <span className="tp-feature-icon"><Check size={18} aria-hidden="true" /></span>
                            <span>
                              <span className="tp-feature-title">{f.title}</span>
                              <span className="tp-feature-sub">{f.sub}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="tp-role-actions">
                      <Link to={p.to} className="tp-btn tp-btn-primary">
                        {p.cta}
                        <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                      <a href="#" className="tp-btn tp-btn-outline" download>
                        <Download size={18} aria-hidden="true" />
                        Install APK file
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          {/* ═════════ PRICING ═════════ */}
          <section className="tp-sec is-grey" id="pricing" aria-labelledby="pricing-title">
            <div className="tp-wrap">
              <div className="tp-section-head tp-reveal">
                <h2 className="tp-h2" id="pricing-title">Plans that grow with your company</h2>
                <p>Choose the plan that matches how many sites and companies you manage. You can change it later.</p>
              </div>
              <div className="tp-plans tp-reveal">
                {PLANS.map((pl) => (
                  <div className={`tp-plan${pl.badge ? ' is-featured' : ''}`} key={pl.id}>
                    {pl.badge && <span className="tp-plan-badge">{pl.badge}</span>}
                    <h3 className="tp-h3">{pl.name}</h3>
                    <p className="tp-plan-for">{pl.for}</p>
                    <div className="tp-plan-price">
                      <span className="tp-plan-price-amount">{pl.price}</span>
                      <span className="tp-plan-price-suffix">{pl.priceSuffix}</span>
                      <span className="tp-plan-price-note">{pl.priceNote}</span>
                    </div>
                    <ul>
                      {pl.features.map((f) => (
                        <li key={f}><Check size={16} aria-hidden="true" />{f}</li>
                      ))}
                    </ul>
                    <a
                      href="#start"
                      className={`tp-btn tp-btn-block ${pl.badge ? 'tp-btn-primary' : 'tp-btn-outline'}`}
                      onClick={() => { setPlan(pl.id); startWith('workspace'); }}
                    >
                      Choose {pl.name}
                    </a>
                  </div>
                ))}
              </div>

              <div className="tp-compare-wrap tp-reveal">
                <table className="tp-compare">
                  <caption>Plan comparison</caption>
                  <thead>
                    <tr>
                      <th scope="col">&nbsp;</th>
                      <th scope="col">Starter</th>
                      <th scope="col" className="tp-compare-col-featured">Business</th>
                      <th scope="col">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_COMPARISON_ROWS.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        {[row.starter, row.business, row.enterprise].map((val, i) => (
                          <td key={i} className={i === 1 ? 'tp-compare-col-featured' : undefined}>
                            {val === true && <Check size={18} className="tp-compare-yes" aria-label="Included" />}
                            {val === false && <Minus size={16} className="tp-compare-no" aria-label="Not included" />}
                            {typeof val === 'string' && val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ═════════ FAQ ═════════ */}
          <section className="tp-sec is-white" id="faq" aria-labelledby="faq-title">
            <div className="tp-wrap tp-faq-grid">
              <div className="tp-reveal">
                <h2 className="tp-h2" id="faq-title">Questions before you start</h2>
                <p className="tp-measure" style={{ marginTop: 14 }}>
                  Cannot find your answer? Book a demo and we will walk you through the system.
                </p>
                <a href="#start" className="tp-btn tp-btn-outline" style={{ marginTop: 26 }} onClick={() => startWith('demo')}>Book a demo</a>
              </div>
              <div className="tp-reveal tp-reveal-delay-1">
                {FAQS.map((f) => (
                  <details className="tp-faq-item" key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ═════════ START (workspace / demo) ═════════ */}
          <section className="tp-sec is-white" id="start" aria-labelledby="start-title">
            <div className="tp-wrap">
              <div className="tp-start-grid">
                <div className="tp-start-intro tp-reveal">
                  <span className="tp-eyebrow">Get started</span>
                  <h2 className="tp-h2" id="start-title">
                    {mode === 'workspace' ? 'Create your company workspace' : 'See TMC Portal in action'}
                  </h2>
                  <p className="tp-measure">
                    {mode === 'workspace'
                      ? 'Tell us about your company and we will get your workspace ready for your first administrator.'
                      : 'Book a walkthrough and we will show you how the portals work for your kind of team.'}
                  </p>
                  <ul className="tp-start-points">
                    <li><Check size={18} aria-hidden="true" />Your own users, sites and settings</li>
                    <li><Check size={18} aria-hidden="true" />All five role portals available</li>
                    <li><Check size={18} aria-hidden="true" />Every sign-in logged and monitored</li>
                  </ul>
                </div>

                <div className="tp-start-panel tp-reveal tp-reveal-delay-1">
                  {submitted ? (
                    <div className="tp-done" role="status">
                      <span className="tp-done-icon"><Check size={24} aria-hidden="true" /></span>
                      <h3 className="tp-h3" style={{ fontSize: '1.2rem' }}>
                        {mode === 'workspace' ? 'Request received' : 'Demo request received'}
                      </h3>
                      <p>
                        {mode === 'workspace' ? (
                          <>We will set up a workspace for <strong>{form.company}</strong> and send the next steps to <strong>{form.email}</strong>.</>
                        ) : (
                          <>We will contact <strong>{form.email}</strong> to arrange a time for <strong>{form.company}</strong>.</>
                        )}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleRequest}>
                      <div className="tp-seg" role="group" aria-label="What would you like to do?">
                        <button type="button" aria-pressed={mode === 'workspace'} onClick={() => setMode('workspace')}>Create a workspace</button>
                        <button type="button" aria-pressed={mode === 'demo'} onClick={() => setMode('demo')}>Book a demo</button>
                      </div>

                      <div className="tp-field">
                        <label htmlFor="ws-company">Company name</label>
                        <input id="ws-company" type="text" required autoComplete="organization" value={form.company} onChange={setField('company')} />
                      </div>
                      <div className="tp-field">
                        <label htmlFor="ws-email">Work email</label>
                        <input id="ws-email" type="email" required autoComplete="email" value={form.email} onChange={setField('email')} />
                      </div>
                      <div className="tp-field">
                        <label htmlFor="ws-size">Number of people</label>
                        <select id="ws-size" required value={form.size} onChange={setField('size')}>
                          <option value="" disabled>Select a range</option>
                          <option>1 to 25</option>
                          <option>26 to 100</option>
                          <option>101 to 500</option>
                          <option>More than 500</option>
                        </select>
                      </div>
                      {mode === 'workspace' && (
                        <div className="tp-field">
                          <label htmlFor="ws-plan">Plan</label>
                          <select id="ws-plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                            {PLANS.map((pl) => (
                              <option key={pl.id} value={pl.id}>{pl.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button type="submit" className="tp-btn tp-btn-primary tp-btn-block">
                        {mode === 'workspace' ? 'Create my workspace' : 'Request a demo'}
                        <ArrowRight size={18} aria-hidden="true" />
                      </button>
                      <p className="tp-form-note">Already have a workspace? Use the Login menu at the top of the page.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ═════════ FOOTER ═════════ */}
        <footer className="tp-footer">
          <div className="tp-wrap">
            <div className="tp-footer-grid">
              <div>
                <span className="tp-footer-logo">
                  <img src="/TMClog0s.png" alt="" />
                 
                </span>
                <p>Workforce, attendance and payroll software with a separate workspace for every company.</p>
              </div>

              <div>
                <h3>Product</h3>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#solutions">Solutions</a></li>
                  <li><a href="#workspaces">Workspaces</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>

              <div>
                <h3>Portals</h3>
                <ul>
                  {PORTALS.map((p) => (
                    <li key={p.id}><a href={`#${p.id}`}>{p.title}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Company</h3>
                <ul>
                  <li><a href="#">Terms and Conditions</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Careers</a></li>
                </ul>
              </div>
            </div>

            <div className="tp-footer-bottom">
              <span>&copy; {new Date().getFullYear()} TMC. All rights reserved.</span>
              <span>Secured with enterprise-grade encryption. All access is logged and monitored.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}