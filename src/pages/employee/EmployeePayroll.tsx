import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ChevronLeft, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { format, eachDayOfInterval, startOfDay, isWeekend, isSaturday, isSunday, lastDayOfMonth, subMonths, getDay } from 'date-fns';
import { formatPHTime } from '@/lib/philippineTime';
import { formatCurrency } from '@/lib/currency';

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
}

interface PayPeriod {
  start: Date;
  end: Date;
  label: string;
  payday: Date;
}

interface DayPayrollData {
  date: Date;
  dayName: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHoursMs: number;
  regularHours: number;
  overtimeHours: number;
}

// Adjust payday: if Saturday move to Friday, if Sunday move to Friday
function adjustPayday(date: Date): Date {
  const day = getDay(date);
  if (day === 6) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1); // Sat -> Fri
  if (day === 0) return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2); // Sun -> Fri
  return date;
}

function getSemiMonthlyPayPeriods(count: number = 12): PayPeriod[] {
  const periods: PayPeriod[] = [];
  const today = startOfDay(new Date());
  let year = today.getFullYear();
  let month = today.getMonth();

  // Determine which half we're in
  if (today.getDate() <= 15) {
    // We're in the 1st-15th period
  } else {
    // We're in the 16th-end period, start from here
  }

  // Generate periods going backwards
  let currentYear = year;
  let currentMonth = month;
  let isFirstHalf = today.getDate() <= 15;

  for (let i = 0; i < count; i++) {
    let start: Date;
    let end: Date;
    let payday: Date;

    if (isFirstHalf) {
      // 1st to 15th
      start = new Date(currentYear, currentMonth, 1);
      end = new Date(currentYear, currentMonth, 15);
      payday = adjustPayday(end);
    } else {
      // 16th to end of month
      start = new Date(currentYear, currentMonth, 16);
      end = lastDayOfMonth(new Date(currentYear, currentMonth, 1));
      payday = adjustPayday(end);
    }

    periods.push({
      start,
      end,
      label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
      payday,
    });

    // Move to previous half
    if (isFirstHalf) {
      // Go to previous month's 2nd half
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      isFirstHalf = false;
    } else {
      // Go to same month's 1st half
      isFirstHalf = true;
    }
  }

  return periods;
}

function calculateDayData(entries: TimeEntry[], regularHoursPerDay: number) {
  let totalMs = 0;
  let clockInTime: Date | null = null;
  let breakStartTime: Date | null = null;
  let breakMs = 0;
  let firstClockIn: Date | null = null;
  let lastClockOut: Date | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    switch (entry.entry_type) {
      case 'clock_in':
        clockInTime = ts;
        breakMs = 0;
        breakStartTime = null;
        if (!firstClockIn) firstClockIn = ts;
        break;
      case 'break_start':
        breakStartTime = ts;
        break;
      case 'break_end':
        if (breakStartTime) { breakMs += ts.getTime() - breakStartTime.getTime(); breakStartTime = null; }
        break;
      case 'clock_out':
        if (clockInTime) {
          let workTime = ts.getTime() - clockInTime.getTime() - breakMs;
          if (breakStartTime) { breakMs += ts.getTime() - breakStartTime.getTime(); workTime = ts.getTime() - clockInTime.getTime() - breakMs; breakStartTime = null; }
          totalMs += Math.max(0, workTime);
          lastClockOut = ts;
          clockInTime = null;
          breakMs = 0;
        }
        break;
    }
  }

  if (clockInTime) {
    const now = new Date();
    const currentBreak = breakStartTime ? now.getTime() - breakStartTime.getTime() : 0;
    totalMs += Math.max(0, now.getTime() - clockInTime.getTime() - breakMs - currentBreak);
  }

  const totalHours = totalMs / (1000 * 60 * 60);
  const regularHours = Math.min(totalHours, regularHoursPerDay);
  const overtimeHours = Math.max(0, totalHours - regularHoursPerDay);

  return {
    totalMs,
    regularHours,
    overtimeHours,
    timeIn: firstClockIn ? formatPHTime(firstClockIn) : null,
    timeOut: lastClockOut ? formatPHTime(lastClockOut) : null,
  };
}

export default function EmployeePayroll() {
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<{ hourly_rate: number } | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [payPeriods] = useState<PayPeriod[]>(getSemiMonthlyPayPeriods(12));
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [overtimeSettings, setOvertimeSettings] = useState({ regular_hours_per_day: 8, overtime_multiplier: 1.5 });

  const selectedPeriod = payPeriods[selectedPeriodIndex];
  const days = eachDayOfInterval({ start: selectedPeriod.start, end: selectedPeriod.end });

  useEffect(() => {
    if (!user) return;
    const fetchEmployee = async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, hourly_rate')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setEmployeeId(data.id);
        setEmployeeData({ hourly_rate: data.hourly_rate });
      }
    };
    fetchEmployee();
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('overtime_settings').select('*').limit(1).single();
      if (data) setOvertimeSettings({ regular_hours_per_day: data.regular_hours_per_day, overtime_multiplier: data.overtime_multiplier });
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    fetchEntries();

    const channel = supabase
      .channel(`employee-payroll-${employeeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: `employee_id=eq.${employeeId}` }, () => fetchEntries())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId, selectedPeriodIndex]);

  const fetchEntries = async () => {
    if (!employeeId) return;
    setLoading(true);
    const startStr = new Date(format(selectedPeriod.start, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const endStr = new Date(format(selectedPeriod.end, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();

    const { data } = await supabase
      .from('time_entries')
      .select('id, entry_type, timestamp')
      .eq('employee_id', employeeId)
      .gte('timestamp', startStr)
      .lte('timestamp', endStr)
      .order('timestamp', { ascending: true });

    if (data) setEntries(data);
    setLoading(false);
  };

  const getEntriesForDay = (day: Date) => entries.filter(e => {
    const entryPHDate = new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    return entryPHDate === format(day, 'yyyy-MM-dd');
  });

  const dayData: DayPayrollData[] = days.map(day => {
    const dayEntries = getEntriesForDay(day);
    const calc = calculateDayData(dayEntries, overtimeSettings.regular_hours_per_day);
    return {
      date: day,
      dayName: format(day, 'EEE'),
      timeIn: calc.timeIn,
      timeOut: calc.timeOut,
      totalHoursMs: calc.totalMs,
      regularHours: calc.regularHours,
      overtimeHours: calc.overtimeHours,
    };
  });

  const hourlyRate = employeeData?.hourly_rate || 0;
  const dailyRate = hourlyRate * overtimeSettings.regular_hours_per_day;
  const totalRegular = dayData.reduce((sum, d) => sum + d.regularHours, 0);
  const totalOvertime = dayData.reduce((sum, d) => sum + d.overtimeHours, 0);
  const grossRegular = totalRegular * hourlyRate;
  const grossOvertime = totalOvertime * hourlyRate * overtimeSettings.overtime_multiplier;
  const totalPay = grossRegular + grossOvertime;
  const daysWorked = dayData.filter(d => d.totalHoursMs > 0).length;

  const navigatePeriod = (dir: 1 | -1) => {
    const next = selectedPeriodIndex + dir;
    if (next >= 0 && next < payPeriods.length) setSelectedPeriodIndex(next);
  };

  return (
    <DashboardLayout portalType="employee">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            My Payroll
          </h1>
          <p className="text-muted-foreground text-sm mt-1">View your pay period breakdown (15th & end of month cycle)</p>
        </div>

        {/* Period Navigator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod(1)} disabled={selectedPeriodIndex >= payPeriods.length - 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[200px] text-center">{selectedPeriod.label}</span>
            <Button variant="ghost" size="icon" onClick={() => navigatePeriod(-1)} disabled={selectedPeriodIndex <= 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            Semi-Monthly (15th & End of Month)
          </Badge>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            <DollarSign className="w-3 h-3 mr-1" />
            Payday: {format(selectedPeriod.payday, 'MMM d, yyyy (EEE)')}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Real-time
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Rate</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(dailyRate)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hourly Rate</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(hourlyRate)}/hr</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross Pay</p>
              <p className="text-sm font-bold text-success">{formatCurrency(grossRegular)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overtime Pay</p>
              <p className="text-sm font-bold text-warning">{formatCurrency(grossOvertime)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pay</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(totalPay)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Breakdown Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-xs">Date</TableHead>
                      <TableHead className="font-semibold text-xs">Day</TableHead>
                      <TableHead className="font-semibold text-xs">Time In</TableHead>
                      <TableHead className="font-semibold text-xs">Time Out</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Total Hrs</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Regular</TableHead>
                      <TableHead className="font-semibold text-xs text-right">OT</TableHead>
                      <TableHead className="font-semibold text-xs text-right">Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayData.map((d) => {
                      const totalHours = d.totalHoursMs / (1000 * 60 * 60);
                      const dayPay = d.regularHours * hourlyRate + d.overtimeHours * hourlyRate * overtimeSettings.overtime_multiplier;
                      const isSatSun = isWeekend(d.date);

                      return (
                        <TableRow key={format(d.date, 'yyyy-MM-dd')} className={isSatSun ? 'bg-muted/30' : ''}>
                          <TableCell className="text-xs font-medium">{format(d.date, 'MMM d')}</TableCell>
                          <TableCell className="text-xs">
                            <span className={isSatSun ? 'text-muted-foreground' : ''}>{d.dayName}</span>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{d.timeIn || '—'}</TableCell>
                          <TableCell className="text-xs font-mono">{d.timeOut || '—'}</TableCell>
                          <TableCell className="text-xs font-mono text-right">
                            {totalHours > 0 ? totalHours.toFixed(2) : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right">
                            {d.regularHours > 0 ? d.regularHours.toFixed(2) : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right">
                            {d.overtimeHours > 0 ? (
                              <span className="text-warning font-semibold">{d.overtimeHours.toFixed(2)}</span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right font-semibold">
                            {dayPay > 0 ? formatCurrency(dayPay) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals Row */}
                    <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                      <TableCell colSpan={4} className="text-xs font-bold text-primary">TOTAL ({daysWorked} days worked)</TableCell>
                      <TableCell className="text-xs font-mono text-right font-bold">
                        {(totalRegular + totalOvertime).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right font-bold">
                        {totalRegular.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right font-bold text-warning">
                        {totalOvertime.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right font-bold text-primary">
                        {formatCurrency(totalPay)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
