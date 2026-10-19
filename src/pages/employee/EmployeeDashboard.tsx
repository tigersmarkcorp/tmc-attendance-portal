import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClockWidget } from '@/components/employee/ClockWidget';
import { EmployeeTimesheets } from '@/components/employee/EmployeeTimesheets';
import { ProfileCard } from '@/components/shared/ProfileCard';
import { PersonalInfoTabs } from '@/components/shared/PersonalInfoTabs';
import { MyTimeBreakdown } from '@/components/shared/MyTimeBreakdown';
import { EmployeeWorkLocationMap } from '@/components/employee/EmployeeWorkLocationMap';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, Clock, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { getPhilippineDateString } from '@/lib/philippineTime';
import { Link } from 'react-router-dom';

interface EmployeeStats {
  hoursThisWeek: number;
  hoursThisMonth: number;
  earningsThisMonth: number;
  leaveBalance: number;
  pendingLeaves: number;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function EmployeeDashboard() {
  const { employeeId, loading, user } = useAuth();
  const [stats, setStats] = useState<EmployeeStats>({
    hoursThisWeek: 0,
    hoursThisMonth: 0,
    earningsThisMonth: 0,
    leaveBalance: 4,
    pendingLeaves: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [weeklyEntries, setWeeklyEntries] = useState<{ entry_type: string; timestamp: string }[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<{ entry_type: string; timestamp: string }[]>([]);
  const [hourlyRate, setHourlyRate] = useState(0);

  // Calculate hours from time_entries (same logic as MyTimeBreakdown)
  const calcMs = (entries: { entry_type: string; timestamp: string }[]) => {
    let totalMs = 0, clockIn: Date | null = null, breakStart: Date | null = null, breakMs = 0;
    for (const e of entries) {
      const ts = new Date(e.timestamp);
      switch (e.entry_type) {
        case 'clock_in': clockIn = ts; breakMs = 0; breakStart = null; break;
        case 'break_start': breakStart = ts; break;
        case 'break_end': if (breakStart) { breakMs += ts.getTime() - breakStart.getTime(); breakStart = null; } break;
        case 'clock_out':
          if (clockIn) {
            let wt = ts.getTime() - clockIn.getTime() - breakMs;
            if (breakStart) { breakMs += ts.getTime() - breakStart.getTime(); wt = ts.getTime() - clockIn.getTime() - breakMs; breakStart = null; }
            totalMs += Math.max(0, wt); clockIn = null; breakMs = 0;
          } break;
      }
    }
    if (clockIn) {
      const now = new Date();
      const cb = breakStart ? now.getTime() - breakStart.getTime() : 0;
      totalMs += Math.max(0, now.getTime() - clockIn.getTime() - breakMs - cb);
    }
    return totalMs;
  };

  const fetchEmployeeData = async () => {
    if (!employeeId) return;

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const weekStartStr = new Date(format(weekStart, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const weekEndStr = new Date(format(weekEnd, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();
    const monthStartStr = new Date(format(monthStart, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const monthEndStr = new Date(format(monthEnd, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();

    const [
      employeeData,
      weeklyEntries,
      monthlyEntries,
      monthlyTimesheets,
      leaveRequests,
      pendingLeaves,
      approvedLeaves,
    ] = await Promise.all([
      supabase.from('employees').select('first_name, last_name, hourly_rate').eq('id', employeeId).maybeSingle(),
      supabase.from('time_entries').select('entry_type, timestamp').eq('employee_id', employeeId).gte('timestamp', weekStartStr).lte('timestamp', weekEndStr).order('timestamp', { ascending: true }),
      supabase.from('time_entries').select('entry_type, timestamp').eq('employee_id', employeeId).gte('timestamp', monthStartStr).lte('timestamp', monthEndStr).order('timestamp', { ascending: true }),
      supabase.from('timesheets').select('total_work_minutes, total_pay').eq('employee_id', employeeId).gte('date', format(monthStart, 'yyyy-MM-dd')).lte('date', format(monthEnd, 'yyyy-MM-dd')),
      supabase.from('leave_requests').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false }).limit(5),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('employee_id', employeeId).eq('status', 'pending'),
      supabase.from('leave_requests').select('start_date, end_date').eq('employee_id', employeeId).eq('status', 'approved'),
    ]);

    if (employeeData.data) {
      setEmployeeName(`${employeeData.data.first_name} ${employeeData.data.last_name}`);
    }

    const hourlyRate = employeeData.data?.hourly_rate || 0;
    
    const weeklyMs = calcMs(weeklyEntries.data || []);
    const monthlyMs = calcMs(monthlyEntries.data || []);
    const weeklyHours = Math.round((weeklyMs / 3600000) * 10) / 10;
    const monthlyHours = Math.round((monthlyMs / 3600000) * 10) / 10;

    const timesheetEarnings = monthlyTimesheets.data?.reduce((sum, ts) => sum + (ts.total_pay || 0), 0) || 0;
    const calculatedEarnings = monthlyHours * hourlyRate;
    const monthlyEarnings = timesheetEarnings > 0 ? timesheetEarnings : calculatedEarnings;

    // Calculate leave balance: 4 days per year minus approved leave days
    const usedLeaveDays = (approvedLeaves.data || []).reduce((total, leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);
    const remainingLeave = Math.max(0, 4 - usedLeaveDays);

    setStats({
      hoursThisWeek: weeklyHours,
      hoursThisMonth: monthlyHours,
      earningsThisMonth: monthlyEarnings,
      leaveBalance: remainingLeave,
      pendingLeaves: pendingLeaves.count || 0,
    });

    setRecentLeaves(leaveRequests.data || []);
    setStatsLoading(false);
  };

  const hasActiveSession = [...weeklyEntries, ...monthlyEntries].some((e, i, arr) => {
    if (e.entry_type === 'clock_in' || e.entry_type === 'break_end') {
      const remaining = arr.slice(i + 1);
      return !remaining.some(r => r.entry_type === 'clock_out');
    }
    return false;
  });

  // Initial fetch on mount
  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  // Live updates: fetch time entries when database changes and refresh every 2s during active sessions
  useEffect(() => {
    if (!employeeId) return;

    const fetchTimeEntries = async () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const weekStartStr = new Date(format(weekStart, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
      const weekEndStr = new Date(format(weekEnd, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();
      const monthStartStr = new Date(format(monthStart, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
      const monthEndStr = new Date(format(monthEnd, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();

      const [weeklyData, monthlyData, empData] = await Promise.all([
        supabase.from('time_entries').select('entry_type, timestamp').eq('employee_id', employeeId).gte('timestamp', weekStartStr).lte('timestamp', weekEndStr).order('timestamp', { ascending: true }),
        supabase.from('time_entries').select('entry_type, timestamp').eq('employee_id', employeeId).gte('timestamp', monthStartStr).lte('timestamp', monthEndStr).order('timestamp', { ascending: true }),
        supabase.from('employees').select('hourly_rate').eq('id', employeeId).maybeSingle(),
      ]);

      setWeeklyEntries(weeklyData.data || []);
      setMonthlyEntries(monthlyData.data || []);
      setHourlyRate(empData.data?.hourly_rate || 0);
    };

    fetchTimeEntries();
    
    // Real-time subscription
    const channel = supabase
      .channel(`employee-dashboard-${employeeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: `employee_id=eq.${employeeId}` }, fetchTimeEntries)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests', filter: `employee_id=eq.${employeeId}` }, fetchEmployeeData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId]);

  // Live recalculation during active sessions (every 2 seconds)
  useEffect(() => {
    if (!hasActiveSession) return;
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, [hasActiveSession]);

  // Recalculate live stats when time entries or tick changes
  useEffect(() => {
    if (weeklyEntries.length === 0 && monthlyEntries.length === 0) return;
    
    const weeklyMs = calcMs(weeklyEntries);
    const monthlyMs = calcMs(monthlyEntries);
    const weeklyHours = Math.round((weeklyMs / 3600000) * 10) / 10;
    const monthlyHours = Math.round((monthlyMs / 3600000) * 10) / 10;
    const calculatedEarnings = monthlyHours * hourlyRate;

    setStats(prev => ({
      ...prev,
      hoursThisWeek: weeklyHours,
      hoursThisMonth: monthlyHours,
      earningsThisMonth: calculatedEarnings,
    }));
  }, [weeklyEntries, monthlyEntries, hourlyRate, tick]);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeId) {
    return (
      <DashboardLayout title="Dashboard">
        <Card className="border-warning">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Account Setup Pending</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your employee profile is not set up yet. Please contact your administrator to complete your account setup.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section - Enhanced */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/[0.06] rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Dashboard</p>
              <h2 className="text-2xl font-bold tracking-tight">Welcome back, {employeeName || 'Employee'}!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {getPhilippineDateString()}
              </p>
            </div>
            <Button asChild className="gradient-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              <Link to="/employee/leave">
                <CalendarDays className="w-4 h-4 mr-2" />
                Request Leave
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <ProfileCard employeeId={employeeId} role="employee" />

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl gradient-primary shadow-md shadow-primary/20">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Hours This Week</p>
                  <p className="text-2xl font-black tracking-tight">{stats.hoursThisWeek}<span className="text-sm font-semibold text-muted-foreground">h</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl gradient-success shadow-md shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Hours This Month</p>
                  <p className="text-2xl font-black tracking-tight">{stats.hoursThisMonth}<span className="text-sm font-semibold text-muted-foreground">h</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl gradient-warning shadow-md shadow-amber-500/20">
                  <DollarSign className="w-5 h-5 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Earnings This Month</p>
                  <p className="text-2xl font-black tracking-tight">₱{stats.earningsThisMonth.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-info shadow-md shadow-blue-500/20">
                  <CalendarDays className="w-5 h-5 text-info-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Leave Balance</p>
                  <p className="text-2xl font-black tracking-tight">{stats.leaveBalance} <span className="text-sm font-semibold text-muted-foreground">days</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <ClockWidget employeeId={employeeId} />
            <PersonalInfoTabs entityType="employee" />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <MyTimeBreakdown entityType="employee" entityId={employeeId} />
            <EmployeeTimesheets employeeId={employeeId} />
          </div>
        </div>

        {/* Work Locations Map */}
        <EmployeeWorkLocationMap employeeId={employeeId} />

        {/* Recent Leave Requests - Enhanced */}
        <Card className="border-primary/10 shadow-lg overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">My Leave Requests</CardTitle>
                <CardDescription className="text-xs">Recent leave request history</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all">
                <Link to="/employee/leave">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <CalendarDays className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-medium">No leave requests yet</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Your leave history will appear here</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
                    <div>
                      <p className="font-semibold text-sm capitalize">{leave.leave_type} Leave</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={`${getLeaveStatusColor(leave.status)} shadow-sm`}>
                      {leave.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
