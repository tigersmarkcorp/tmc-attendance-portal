import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#c2410c'];

export function DashboardAnalytics() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [payrollTrend, setPayrollTrend] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    // Last 7 days attendance
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return format(d, 'yyyy-MM-dd');
    });

    const [tsResult, empResult, payrollResult] = await Promise.all([
      supabase.from('timesheets').select('date, total_work_minutes').in('date', days),
      supabase.from('employees').select('department, status'),
      supabase.from('timesheets').select('date, total_pay').in('date', days),
    ]);

    // Attendance by day
    const dayMap = new Map<string, { count: number; hours: number }>();
    days.forEach(d => dayMap.set(d, { count: 0, hours: 0 }));
    tsResult.data?.forEach(ts => {
      const existing = dayMap.get(ts.date) || { count: 0, hours: 0 };
      existing.count++;
      existing.hours += (ts.total_work_minutes || 0) / 60;
      dayMap.set(ts.date, existing);
    });
    setAttendanceData(days.map(d => ({
      day: format(new Date(d), 'EEE'),
      attendance: dayMap.get(d)?.count || 0,
      hours: Math.round((dayMap.get(d)?.hours || 0) * 10) / 10,
    })));

    // Department distribution
    const deptMap = new Map<string, number>();
    empResult.data?.forEach(e => {
      const dept = e.department || 'Unassigned';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });
    setDepartmentData(Array.from(deptMap.entries()).map(([name, value]) => ({ name, value })));

    // Status distribution
    const statusMap = new Map<string, number>();
    empResult.data?.forEach(e => {
      statusMap.set(e.status, (statusMap.get(e.status) || 0) + 1);
    });
    setStatusData(Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })));

    // Payroll trend
    const payMap = new Map<string, number>();
    days.forEach(d => payMap.set(d, 0));
    payrollResult.data?.forEach(ts => {
      payMap.set(ts.date, (payMap.get(ts.date) || 0) + (ts.total_pay || 0));
    });
    setPayrollTrend(days.map(d => ({
      day: format(new Date(d), 'EEE'),
      payroll: Math.round(payMap.get(d) || 0),
    })));
  };

  useEffect(() => {
    fetchAnalytics();
    const channel = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'timesheets' }, () => fetchAnalytics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchAnalytics())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Attendance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Attendance</CardTitle>
          <CardDescription>Last 7 days employee attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area type="monotone" dataKey="attendance" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} name="Employees" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Work Hours Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Work Hours Trend</CardTitle>
          <CardDescription>Total hours worked per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="hours" fill="#f97316" radius={[6, 6, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Department Distribution</CardTitle>
          <CardDescription>Employees by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {departmentData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Payroll */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Daily Payroll Cost</CardTitle>
          <CardDescription>Last 7 days payroll spending</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={payrollTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Payroll']}
              />
              <Line type="monotone" dataKey="payroll" stroke="#ea580c" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="Payroll" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
