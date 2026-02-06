import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ClockWidget } from '@/components/employee/ClockWidget';
import { EmployeeTimesheets } from '@/components/employee/EmployeeTimesheets';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, Clock, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
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
    leaveBalance: 20,
    pendingLeaves: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) return;

      const today = new Date();
      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Fetch all data in parallel
      const [
        employeeData,
        weeklyTimesheets,
        monthlyTimesheets,
        leaveRequests,
        pendingLeaves,
      ] = await Promise.all([
        supabase.from('employees').select('first_name, last_name, hourly_rate').eq('id', employeeId).maybeSingle(),
        supabase.from('timesheets').select('total_work_minutes, total_pay').eq('employee_id', employeeId).gte('date', format(weekStart, 'yyyy-MM-dd')).lte('date', format(weekEnd, 'yyyy-MM-dd')),
        supabase.from('timesheets').select('total_work_minutes, total_pay').eq('employee_id', employeeId).gte('date', format(monthStart, 'yyyy-MM-dd')).lte('date', format(monthEnd, 'yyyy-MM-dd')),
        supabase.from('leave_requests').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false }).limit(5),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('employee_id', employeeId).eq('status', 'pending'),
      ]);

      if (employeeData.data) {
        setEmployeeName(`${employeeData.data.first_name} ${employeeData.data.last_name}`);
      }

      const weeklyMinutes = weeklyTimesheets.data?.reduce((sum, ts) => sum + (ts.total_work_minutes || 0), 0) || 0;
      const monthlyMinutes = monthlyTimesheets.data?.reduce((sum, ts) => sum + (ts.total_work_minutes || 0), 0) || 0;
      const monthlyEarnings = monthlyTimesheets.data?.reduce((sum, ts) => sum + (ts.total_pay || 0), 0) || 0;

      setStats({
        hoursThisWeek: Math.round((weeklyMinutes / 60) * 10) / 10,
        hoursThisMonth: Math.round((monthlyMinutes / 60) * 10) / 10,
        earningsThisMonth: monthlyEarnings,
        leaveBalance: 20, // This would come from a leave balance table in a full implementation
        pendingLeaves: pendingLeaves.count || 0,
      });

      setRecentLeaves(leaveRequests.data || []);
      setStatsLoading(false);
    };

    fetchEmployeeData();
  }, [employeeId]);

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
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {employeeName || 'Employee'}!</h2>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button asChild className="gradient-primary">
            <Link to="/employee/leave">
              <CalendarDays className="w-4 h-4 mr-2" />
              Request Leave
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-primary">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours This Week</p>
                  <p className="text-xl font-bold">{stats.hoursThisWeek}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-success">
                  <TrendingUp className="w-5 h-5 text-success-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hours This Month</p>
                  <p className="text-xl font-bold">{stats.hoursThisMonth}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg gradient-warning">
                  <DollarSign className="w-5 h-5 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Earnings This Month</p>
                  <p className="text-xl font-bold">₱{stats.earningsThisMonth.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info">
                  <CalendarDays className="w-5 h-5 text-info-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Leave Balance</p>
                  <p className="text-xl font-bold">{stats.leaveBalance} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock Widget */}
          <div className="lg:col-span-1">
            <ClockWidget employeeId={employeeId} />
          </div>

          {/* Timesheets */}
          <div className="lg:col-span-2">
            <EmployeeTimesheets employeeId={employeeId} />
          </div>
        </div>

        {/* Recent Leave Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">My Leave Requests</CardTitle>
                <CardDescription>Recent leave request history</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/employee/leave">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No leave requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium capitalize">{leave.leave_type} Leave</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={getLeaveStatusColor(leave.status)}>
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
