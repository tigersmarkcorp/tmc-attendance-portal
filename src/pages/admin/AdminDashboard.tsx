import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { RealTimeAttendance } from '@/components/admin/RealTimeAttendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  CheckCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';

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
  employee: { first_name: string; last_name: string };
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function AdminDashboard() {
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

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      // Parallel fetch all stats
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
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('time_entries').select('employee_id, entry_type').gte('timestamp', today.toISOString()),
        supabase.from('timesheets').select('total_work_minutes').eq('date', format(today, 'yyyy-MM-dd')),
        supabase.from('timesheets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('timesheets').select('total_pay').gte('date', format(monthStart, 'yyyy-MM-dd')).lte('date', format(monthEnd, 'yyyy-MM-dd')).eq('status', 'approved'),
        supabase.from('leave_requests').select(`
          id,
          leave_type,
          start_date,
          end_date,
          status,
          employees!leave_requests_employee_id_fkey (first_name, last_name)
        `).order('created_at', { ascending: false }).limit(5),
      ]);

      // Calculate active today and on break
      const uniqueEmployees = new Set<string>();
      const employeeStatus = new Map<string, string>();
      todayEntries.data?.forEach((entry) => {
        uniqueEmployees.add(entry.employee_id);
        employeeStatus.set(entry.employee_id, entry.entry_type);
      });

      const activeToday = uniqueEmployees.size;
      const onBreak = Array.from(employeeStatus.values()).filter((status) => status === 'break_start').length;

      // Calculate total hours today
      const totalMinutes = timesheets.data?.reduce((sum, ts) => sum + (ts.total_work_minutes || 0), 0) || 0;

      // Calculate monthly payroll
      const monthlyPayroll = monthlyTimesheets.data?.reduce((sum, ts) => sum + (ts.total_pay || 0), 0) || 0;

      // Calculate attendance rate (active today / active employees)
      const attendanceRate = activeEmployeesResult.count 
        ? Math.round((activeToday / activeEmployeesResult.count) * 100) 
        : 0;

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

      // Format recent leaves
      const formattedLeaves = recentLeavesData.data?.map((leave: any) => ({
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timesheets' }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, Admin!</h2>
            <p className="text-muted-foreground">
              Here's what's happening today, {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/employees">
                <Users className="w-4 h-4 mr-2" />
                Add Employee
              </Link>
            </Button>
            <Button asChild className="gradient-primary">
              <Link to="/admin/payroll">
                <DollarSign className="w-4 h-4 mr-2" />
                Generate Payroll
              </Link>
            </Button>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={<Users className="w-6 h-6 text-primary-foreground" />}
            description={`${stats.activeEmployees} active`}
          />
          <StatsCard
            title="Active Today"
            value={stats.activeToday}
            icon={<Activity className="w-6 h-6 text-success-foreground" />}
            iconClassName="gradient-success"
            description={`${stats.onBreak} on break`}
          />
          <StatsCard
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            icon={<TrendingUp className="w-6 h-6 text-info-foreground" />}
            iconClassName="bg-info"
            trend={{ value: stats.attendanceRate >= 80 ? 5 : -5, positive: stats.attendanceRate >= 80 }}
          />
          <StatsCard
            title="Hours Today"
            value={`${stats.totalHoursToday}h`}
            icon={<Clock className="w-6 h-6 text-warning-foreground" />}
            iconClassName="gradient-warning"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Timesheets</p>
                    <p className="text-xl font-bold">{stats.pendingTimesheets}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin/timesheets">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <CalendarDays className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Leaves</p>
                    <p className="text-xl font-bold">{stats.pendingLeaves}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin/leave-requests">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                    <p className="text-xl font-bold">${stats.monthlyPayroll.toLocaleString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin/payroll">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/10">
                    <Building2 className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-xl font-bold">{stats.departmentCount}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin/departments">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Activity */}
          <div className="lg:col-span-2">
            <RealTimeAttendance />
          </div>

          {/* Recent Leave Requests */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Leave Requests</CardTitle>
                  <CardDescription>Recent requests</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/leave-requests">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLeaves.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent requests</p>
              ) : (
                recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">
                        {leave.employee?.first_name} {leave.employee?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {leave.leave_type} • {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                      </p>
                    </div>
                    <Badge className={getLeaveStatusColor(leave.status)}>
                      {leave.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/employees">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-xs">Manage Employees</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/timesheets">
                  <FileText className="w-5 h-5 text-success" />
                  <span className="text-xs">Review Timesheets</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/leave-requests">
                  <CalendarDays className="w-5 h-5 text-warning" />
                  <span className="text-xs">Leave Requests</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/calendar">
                  <Calendar className="w-5 h-5 text-info" />
                  <span className="text-xs">View Calendar</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/departments">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="text-xs">Departments</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/admin/overtime-settings">
                  <TrendingUp className="w-5 h-5 text-destructive" />
                  <span className="text-xs">Overtime Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
