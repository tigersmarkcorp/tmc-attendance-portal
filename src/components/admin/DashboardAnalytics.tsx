import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { format, subDays } from 'date-fns';

// Distinct, readable palette (blue / orange / green / purple / slate / pink)
const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#94a3b8', '#ec4899'];

// Shared themed tooltip (presentation only)
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: p.color || p.payload?.fill || p.stroke }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

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

  // Derived values for display only
  const departmentTotal = departmentData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Attendance */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Weekly Attendance</CardTitle>
          <CardDescription>Last 7 days employee attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={attendanceData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.7} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#f97316', strokeOpacity: 0.3, strokeDasharray: '4 4' }} />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#f97316"
                fill="url(#attendanceFill)"
                strokeWidth={3}
                name="Employees"
                dot={{ r: 4, fill: 'hsl(var(--card))', stroke: '#f97316', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#f97316', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Distribution */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Department Distribution</CardTitle>
          <CardDescription>Employees by department</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
              No department data yet
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Donut with total in the center */}
              <div className="relative w-full sm:w-1/2 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={100}
                      paddingAngle={3}
                      cornerRadius={6}
                      dataKey="value"
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      animationDuration={900}
                    >
                      {departmentData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold leading-none">{departmentTotal}</span>
                  <span className="text-xs text-muted-foreground mt-1">Total Employees</span>
                </div>
              </div>

              {/* Legend with counts and percentages */}
              <ul className="w-full sm:w-1/2 space-y-2">
                {departmentData.map((d, index) => {
                  const pct = departmentTotal ? Math.round((d.value / departmentTotal) * 100) : 0;
                  return (
                    <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate">{d.name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                        {d.value} ({pct}%)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}