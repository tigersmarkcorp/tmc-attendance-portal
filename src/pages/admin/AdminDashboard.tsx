import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RealTimeAttendance } from '@/components/admin/RealTimeAttendance';
import { WhosInOut } from '@/components/admin/WhosInOut';
import { WorkLocationMap } from '@/components/admin/WorkLocationMap';
import { LocationCarousel } from '@/components/admin/LocationCarousel';
import { RealTimeLocationMonitor } from '@/components/admin/RealTimeLocationMonitor';
import { DashboardAnalytics } from '@/components/admin/DashboardAnalytics';
import { WeatherWidget } from '@/components/admin/WeatherWidget';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  Building2,
  FileText,
  CalendarDays,
  Activity,
} from 'lucide-react';

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

import { Link } from 'react-router-dom';

/* ============================================================= */
/* TYPES                                                         */
/* ============================================================= */

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  activeToday: number;
  onBreak: number;
  totalHoursToday: number;
  pendingTimesheets: number;
  pendingLeaves: number;
  departmentCount: number;
  monthlyPayroll: number;
  attendanceRate: number;
}

interface RecentLeaveRequest {
  id: string;
  employee: {
    first_name: string;
    last_name: string;
  };
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

/* ============================================================= */
/* HERO IMAGE  ->  public/images/hero-construction.png           */
/* ============================================================= */

const HERO_PHOTO = '/images/hero-construction.png';

/* ============================================================= */
/* CARD COLORS                                                   */
/* ============================================================= */

type Tone = 'primary' | 'success' | 'info' | 'warning';

const toneStyles: Record<
  Tone,
  {
    card: string;
    icon: string;
    chip: string;
    stroke: string;
    accent: string;
    glow: string;
  }
> = {
  primary: {
    card: 'from-orange-500/[0.08] via-orange-500/[0.025] to-card border-orange-500/15 hover:border-orange-500/30',
    icon: 'from-orange-500 to-orange-600 text-white shadow-orange-500/20',
    chip: 'bg-orange-500/10 text-orange-600',
    stroke: '#f97316',
    accent: 'from-orange-500 to-orange-500/0',
    glow: 'bg-orange-500/10',
  },
  success: {
    card: 'from-emerald-500/[0.08] via-emerald-500/[0.025] to-card border-emerald-500/15 hover:border-emerald-500/30',
    icon: 'from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20',
    chip: 'bg-emerald-500/10 text-emerald-600',
    stroke: '#10b981',
    accent: 'from-emerald-500 to-emerald-500/0',
    glow: 'bg-emerald-500/10',
  },
  info: {
    card: 'from-blue-500/[0.08] via-blue-500/[0.025] to-card border-blue-500/15 hover:border-blue-500/30',
    icon: 'from-blue-500 to-blue-600 text-white shadow-blue-500/20',
    chip: 'bg-blue-500/10 text-blue-600',
    stroke: '#3b82f6',
    accent: 'from-blue-500 to-blue-500/0',
    glow: 'bg-blue-500/10',
  },
  warning: {
    card: 'from-violet-500/[0.08] via-violet-500/[0.025] to-card border-violet-500/15 hover:border-violet-500/30',
    icon: 'from-violet-500 to-violet-600 text-white shadow-violet-500/20',
    chip: 'bg-violet-500/10 text-violet-600',
    stroke: '#8b5cf6',
    accent: 'from-violet-500 to-violet-500/0',
    glow: 'bg-violet-500/10',
  },
};

/* ============================================================= */
/* DECORATIVE SPARKLINES                                         */
/* ============================================================= */

const SPARK_PATHS = [
  'M0 32 C 20 30, 30 20, 50 24 S 85 34, 105 22 S 140 10, 160 16 S 190 8, 200 6',
  'M0 28 C 25 34, 40 14, 65 20 S 100 30, 125 18 S 165 6, 200 12',
  'M0 22 C 20 12, 45 30, 70 20 S 110 8, 135 20 S 175 28, 200 10',
  'M0 30 C 30 26, 45 32, 75 22 S 120 18, 145 12 S 180 14, 200 4',
];

function Sparkline({
  stroke,
  id,
  variant = 0,
}: {
  stroke: string;
  id: string;
  variant?: number;
}) {
  const d = SPARK_PATHS[variant % SPARK_PATHS.length];

  return (
    <svg
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      className="h-10 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L200 40 L0 40 Z`} fill={`url(#spark-${id})`} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ============================================================= */
/* MAIN STAT CARD                                                */
/* ============================================================= */

interface StatTileProps {
  id: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone: Tone;
  variant?: number;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

function StatTile({
  id,
  title,
  value,
  icon,
  tone,
  variant = 0,
  description,
  trend,
}: StatTileProps) {
  const t = toneStyles[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${t.card}`}
    >
      {/* Top accent */}
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${t.accent}`}
      />

      {/* Glow */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60 blur-2xl ${t.glow}`}
      />

      {/* Header */}
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md sm:h-12 sm:w-12 ${t.icon}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="relative mt-3 min-h-[1.5rem] text-[11px] sm:text-xs">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              trend.positive
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {trend.positive ? '▲' : '▼'}
            {Math.abs(trend.value)}% vs last week
          </span>
        ) : description ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${t.chip}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {description}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
            No change
          </span>
        )}
      </div>

      {/* Graph */}
      <div className="relative -mx-1 mt-1">
        <Sparkline stroke={t.stroke} id={id} variant={variant} />
      </div>
    </div>
  );
}

/* ============================================================= */
/* MINI STAT CARD                                                */
/* ============================================================= */

interface MiniTileProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone: Tone;
  to: string;
}

function MiniTile({ title, value, icon, tone, to }: MiniTileProps) {
  const t = toneStyles[tone];

  return (
    <Link
      to={to}
      className={`group relative flex items-center justify-between gap-2 overflow-hidden rounded-2xl border bg-gradient-to-br p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:gap-3 sm:p-4 ${t.card}`}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/80 shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-bold tracking-tight sm:text-xl">{value}</p>
        </div>
      </div>

      <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background/80 sm:flex text-muted-foreground shadow-sm transition-all group-hover:bg-[#081d3b] group-hover:text-white">
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/* ============================================================= */
/* INITIALS                                                      */
/* ============================================================= */

const getInitials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';

/* ============================================================= */
/* WEATHER GLASS WRAPPER (frosted card inside hero)              */
/* ============================================================= */

const WEATHER_GLASS =
  'w-full [&_*]:!border-0 [&_*]:!bg-transparent [&_*]:!shadow-none [&_*]:!backdrop-blur-none [&_*]:!text-white';

/* ============================================================= */
/* ADMIN DASHBOARD                                               */
/* ============================================================= */

export default function AdminDashboard() {
  /* =========================================================== */
  /* EXISTING STATE                                              */
  /* =========================================================== */

  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeEmployees: 0,
    activeToday: 0,
    onBreak: 0,
    totalHoursToday: 0,
    pendingTimesheets: 0,
    pendingLeaves: 0,
    departmentCount: 0,
    monthlyPayroll: 0,
    attendanceRate: 0,
  });

  const [recentLeaves, setRecentLeaves] = useState<RecentLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================== */
  /* EXISTING DATABASE LOGIC (UNCHANGED)                         */
  /* =========================================================== */

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      void weekStart;
      void weekEnd;

      /* Parallel fetch all stats */

      const [
        employeesResult,
        activeEmployeesResult,
        todayEntries,
        timesheets,
        pendingTimesheets,
        pendingLeaves,
        departments,
        monthlyTimesheets,
        recentLeavesData,
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),

        supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),

        supabase
          .from('time_entries')
          .select('employee_id, entry_type')
          .gte('timestamp', today.toISOString()),

        supabase
          .from('timesheets')
          .select('total_work_minutes')
          .eq('date', format(today, 'yyyy-MM-dd')),

        supabase
          .from('timesheets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase.from('departments').select('*', { count: 'exact', head: true }),

        supabase
          .from('timesheets')
          .select('total_pay')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd'))
          .eq('status', 'approved'),

        supabase
          .from('leave_requests')
          .select(`
            id,
            leave_type,
            start_date,
            end_date,
            status,
            employees!leave_requests_employee_id_fkey (
              first_name,
              last_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      /* ACTIVE TODAY / BREAK */

      const uniqueEmployees = new Set<string>();
      const employeeStatus = new Map<string, string>();

      todayEntries.data?.forEach((entry) => {
        uniqueEmployees.add(entry.employee_id);
        employeeStatus.set(entry.employee_id, entry.entry_type);
      });

      const activeToday = uniqueEmployees.size;

      const onBreak = Array.from(employeeStatus.values()).filter(
        (status) => status === 'break_start'
      ).length;

      /* TOTAL HOURS */

      const totalMinutes =
        timesheets.data?.reduce(
          (sum, ts) => sum + (ts.total_work_minutes || 0),
          0
        ) || 0;

      /* MONTHLY PAYROLL */

      const monthlyPayroll =
        monthlyTimesheets.data?.reduce(
          (sum, ts) => sum + (ts.total_pay || 0),
          0
        ) || 0;

      /* ATTENDANCE RATE */

      const attendanceRate = activeEmployeesResult.count
        ? Math.round((activeToday / activeEmployeesResult.count) * 100)
        : 0;

      /* UPDATE STATS */

      setStats({
        totalEmployees: employeesResult.count || 0,
        activeEmployees: activeEmployeesResult.count || 0,
        activeToday,
        onBreak,
        totalHoursToday: Math.round((totalMinutes / 60) * 10) / 10,
        pendingTimesheets: pendingTimesheets.count || 0,
        pendingLeaves: pendingLeaves.count || 0,
        departmentCount: departments.count || 0,
        monthlyPayroll,
        attendanceRate,
      });

      /* RECENT LEAVE REQUESTS */

      const formattedLeaves =
        recentLeavesData.data?.map((leave: any) => ({
          id: leave.id,
          employee: leave.employees,
          leave_type: leave.leave_type,
          start_date: leave.start_date,
          end_date: leave.end_date,
          status: leave.status,
        })) || [];

      setRecentLeaves(formattedLeaves);
      setLoading(false);
    };

    fetchStats();

    /* EXISTING REALTIME SUBSCRIPTION */

    const channel = supabase
      .channel('dashboard-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timesheets' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =========================================================== */
  /* LEAVE STATUS                                                */
  /* =========================================================== */

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success text-success-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  /* =========================================================== */
  /* UI                                                          */
  /* =========================================================== */

  const todayLabel = format(new Date(), 'EEEE, MMMM d, yyyy');

  const quickActions = [
    { to: '/admin/employees', label: 'Manage Employees', icon: Users, color: 'orange' },
    { to: '/admin/timesheets', label: 'Review Timesheets', icon: FileText, color: 'emerald' },
    { to: '/admin/leave-requests', label: 'Leave Requests', icon: CalendarDays, color: 'orange' },
    { to: '/admin/calendar', label: 'View Calendar', icon: Calendar, color: 'blue' },
    { to: '/admin/departments', label: 'Departments', icon: Building2, color: 'violet' },
    { to: '/admin/overtime-settings', label: 'Overtime Settings', icon: TrendingUp, color: 'red' },
  ];

  /* Tailwind needs full class names, so map them statically */
  const quickColor: Record<string, { btn: string; chip: string; icon: string }> = {
    orange: {
      btn: 'hover:border-orange-500/40 hover:bg-orange-500/5',
      chip: 'bg-orange-500/10',
      icon: 'text-orange-500',
    },
    emerald: {
      btn: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
      chip: 'bg-emerald-500/10',
      icon: 'text-emerald-500',
    },
    blue: {
      btn: 'hover:border-blue-500/40 hover:bg-blue-500/5',
      chip: 'bg-blue-500/10',
      icon: 'text-blue-500',
    },
    violet: {
      btn: 'hover:border-violet-500/40 hover:bg-violet-500/5',
      chip: 'bg-violet-500/10',
      icon: 'text-violet-500',
    },
    red: {
      btn: 'hover:border-red-500/40 hover:bg-red-500/5',
      chip: 'bg-red-500/10',
      icon: 'text-red-500',
    },
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="w-full min-w-0 space-y-5 overflow-x-hidden sm:space-y-6">
        {/* ===================================================== */}
        {/* TOP DASHBOARD GRID                                    */}
        {/* ===================================================== */}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* LEFT */}
          <div className="min-w-0 space-y-5">
            {/* ================= HERO ================= */}

            <div className="relative w-full overflow-hidden rounded-xl bg-[#071b3d] text-white shadow-md ring-1 ring-black/5">
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${HERO_PHOTO})` }}
              />


              {/* Left-to-right dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#03142f]/90 via-[#061b38]/35 to-[#03142f]/20" />

              {/* Bottom overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#03142f]/35 via-transparent to-transparent" />

              {/* DESKTOP */}
              <div className="relative z-10 hidden min-h-[150px] items-center md:flex">
                {/* Left content */}
                <div className="flex min-w-0 flex-1 flex-col justify-center px-7 py-5">
                  <div className="mb-3 h-[4px] w-9 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.35)]" />

                  <h2 className="text-[22px] font-bold leading-tight tracking-tight text-white drop-shadow-md lg:text-[26px]">
                    Welcome back,{' '}
                    <span className="text-orange-500">Admin!</span>
                  </h2>

                  <p className="mt-2 text-[12px] font-normal text-white/85 drop-shadow lg:text-[13px]">
                    Here's what's happening today, {todayLabel}
                  </p>
                </div>

                {/* Weather (frosted glass card) */}
                <div className="flex w-[52%] shrink-0 items-center justify-end px-5 py-3">
                  <div className={WEATHER_GLASS}>
                    <WeatherWidget />
                  </div>
                </div>
              </div>

              {/* MOBILE */}
              <div className="relative z-10 md:hidden">
                <div className="px-5 pb-4 pt-5">
                  <div className="mb-3 h-[4px] w-8 rounded-full bg-orange-500" />

                  <h2 className="text-[22px] font-bold leading-tight tracking-tight text-white">
                    Welcome back,{' '}
                    <span className="text-orange-500">Admin!</span>
                  </h2>

                  <p className="mt-2 text-[12px] leading-relaxed text-white/80">
                    Here's what's happening today, {todayLabel}
                  </p>
                </div>

                <div className="border-t border-white/10 px-4 py-3">
                  <div className={WEATHER_GLASS}>
                    <WeatherWidget />
                  </div>
                </div>
              </div>
            </div>

            {/* ================= OVERVIEW ================= */}

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight sm:text-lg">
                  Overview
                </h3>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  Today's workforce summary
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            </div>

            {/* ================= PRIMARY STATS ================= */}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile
                id="employees"
                tone="primary"
                variant={0}
                title="Total Employees"
                value={stats.totalEmployees}
                icon={<Users className="h-6 w-6" />}
                description={`${stats.activeEmployees} active`}
              />

              <StatTile
                id="active"
                tone="success"
                variant={1}
                title="Active Today"
                value={stats.activeToday}
                icon={<Activity className="h-6 w-6" />}
                description={`${stats.onBreak} on break`}
              />

              <StatTile
                id="attendance"
                tone="info"
                variant={2}
                title="Attendance Rate"
                value={`${stats.attendanceRate}%`}
                icon={<TrendingUp className="h-6 w-6" />}
                trend={{
                  value: stats.attendanceRate >= 80 ? 5 : -5,
                  positive: stats.attendanceRate >= 80,
                }}
              />

              <StatTile
                id="hours"
                tone="warning"
                variant={3}
                title="Hours Today"
                value={`${stats.totalHoursToday}h`}
                icon={<Clock className="h-6 w-6" />}
              />
            </div>

            {/* ================= SECONDARY STATS ================= */}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <MiniTile
                to="/admin/timesheets"
                tone="primary"
                title="Pending Timesheets"
                value={stats.pendingTimesheets}
                icon={<FileText className="h-5 w-5 text-orange-500" />}
              />

              <MiniTile
                to="/admin/leave-requests"
                tone="info"
                title="Pending Leaves"
                value={stats.pendingLeaves}
                icon={<CalendarDays className="h-5 w-5 text-blue-500" />}
              />

              <MiniTile
                to="/admin/payroll"
                tone="success"
                title="Monthly Payroll"
                value={`$${stats.monthlyPayroll.toLocaleString()}`}
                icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              />

              <MiniTile
                to="/admin/departments"
                tone="warning"
                title="Departments"
                value={stats.departmentCount}
                icon={<Building2 className="h-5 w-5 text-violet-500" />}
              />
            </div>

            {/* ================= ANALYTICS ================= */}

            <DashboardAnalytics />
          </div>

          {/* RIGHT COLUMN */}
          <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
            {/* Buttons */}
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button
                asChild
                variant="outline"
                className="h-11 flex-1 rounded-xl border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link to="/admin/employees">
                  <Users className="mr-2 h-4 w-4" />
                  Add Employee
                </Link>
              </Button>

              <Button
                asChild
                className="h-11 flex-1 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg"
              >
                <Link to="/admin/payroll">Generate Payroll</Link>
              </Button>
            </div>

            {/* Who's In/Out */}
            <div className="overflow-hidden rounded-2xl shadow-sm [&>*]:rounded-2xl">
              <WhosInOut />
            </div>
          </div>
        </div>

        {/* LOCATION CAROUSEL */}
        <LocationCarousel />

        {/* WORK LOCATION MAP */}
        <WorkLocationMap />

        {/* REAL-TIME LOCATION MONITOR */}
        <RealTimeLocationMonitor />

        {/* ===================================================== */}
        {/* REALTIME + LEAVE REQUESTS                             */}
        {/* ===================================================== */}

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RealTimeAttendance />
          </div>

          <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                    <CalendarDays className="h-5 w-5 text-orange-500" />
                  </div>

                  <div>
                    <CardTitle className="text-lg">Leave Requests</CardTitle>
                    <CardDescription>Recent requests</CardDescription>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="rounded-full"
                >
                  <Link to="/admin/leave-requests">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {recentLeaves.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <p className="text-center text-sm">No recent requests</p>
                </div>
              ) : (
                recentLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-muted/40 p-3 transition-all hover:border-border hover:bg-muted/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-semibold text-orange-600 ring-1 ring-orange-500/20">
                        {getInitials(
                          leave.employee?.first_name,
                          leave.employee?.last_name
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {leave.employee?.first_name}{' '}
                          {leave.employee?.last_name}
                        </p>

                        <p className="truncate text-xs capitalize text-muted-foreground">
                          {leave.leave_type}
                          {' • '}
                          {format(new Date(leave.start_date), 'MMM d')}
                          {' - '}
                          {format(new Date(leave.end_date), 'MMM d')}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={`shrink-0 rounded-full capitalize ${getLeaveStatusColor(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================================================== */}
        {/* QUICK ACTIONS                                         */}
        {/* ===================================================== */}

        <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {quickActions.map(({ to, label, icon: Icon, color }) => {
                const c = quickColor[color];
                return (
                  <Button
                    key={to}
                    variant="outline"
                    asChild
                    className={`group h-auto flex-col gap-2 rounded-2xl py-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:py-5 ${c.btn}`}
                  >
                    <Link to={to}>
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${c.chip}`}
                      >
                        <Icon className={`h-5 w-5 ${c.icon}`} />
                      </span>
                      <span className="text-xs font-medium">{label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}