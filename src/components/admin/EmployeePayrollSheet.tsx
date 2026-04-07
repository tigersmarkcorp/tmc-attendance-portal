import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import { format, eachDayOfInterval, endOfMonth, getDay, subDays, addMonths, subMonths, isWeekend } from 'date-fns';
import { formatPHTime } from '@/lib/philippineTime';
import { formatCurrency } from '@/lib/currency';
import { exportPayrollToExcel } from '@/lib/exportPayroll';

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
}

interface EmployeePayrollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    hourly_rate: number;
  } | null;
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

type CutoffPeriod = 'first' | 'second';

function getPayday(year: number, month: number, period: CutoffPeriod): Date {
  let payday: Date;
  if (period === 'first') {
    payday = new Date(year, month, 15);
  } else {
    payday = endOfMonth(new Date(year, month, 1));
  }
  // If Saturday, move to Friday
  const dow = getDay(payday);
  if (dow === 6) payday = subDays(payday, 1);
  // If Sunday, move to Friday
  if (dow === 0) payday = subDays(payday, 2);
  return payday;
}

function getCutoffRange(year: number, month: number, period: CutoffPeriod): { start: Date; end: Date } {
  if (period === 'first') {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month, 15),
    };
  } else {
    return {
      start: new Date(year, month, 16),
      end: endOfMonth(new Date(year, month, 1)),
    };
  }
}

function calculateDayData(entries: TimeEntry[], regularHoursPerDay: number): { totalMs: number; regularHours: number; overtimeHours: number; timeIn: string | null; timeOut: string | null } {
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

  // If still clocked in
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

function formatHours(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  return hours.toFixed(2);
}

export function EmployeePayrollSheet({ open, onOpenChange, employee }: EmployeePayrollSheetProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refDate, setRefDate] = useState(new Date());
  const [cutoff, setCutoff] = useState<CutoffPeriod>(() => {
    const today = new Date();
    return today.getDate() <= 15 ? 'first' : 'second';
  });
  const [overtimeSettings, setOvertimeSettings] = useState({
    regular_hours_per_day: 8,
    overtime_multiplier: 1.5,
  });

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const { start, end } = getCutoffRange(year, month, cutoff);
  const payday = getPayday(year, month, cutoff);
  const days = eachDayOfInterval({ start, end });

  useEffect(() => {
    if (!open || !employee) return;
    fetchOvertimeSettings();
  }, [open, employee]);

  useEffect(() => {
    if (!open || !employee) return;
    fetchEntries();
    const channel = supabase
      .channel(`payroll-${employee.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, employee?.id, year, month, cutoff]);

  const fetchOvertimeSettings = async () => {
    const { data } = await supabase.from('overtime_settings').select('*').limit(1).single();
    if (data) {
      setOvertimeSettings({
        regular_hours_per_day: data.regular_hours_per_day,
        overtime_multiplier: data.overtime_multiplier,
      });
    }
  };

  const fetchEntries = async () => {
    if (!employee) return;
    setLoading(true);
    const startStr = new Date(format(start, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const endStr = new Date(format(end, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();

    const { data } = await supabase
      .from('time_entries')
      .select('id, entry_type, timestamp')
      .eq('employee_id', employee.id)
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

  // Build payroll data per day
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

  const hourlyRate = employee?.hourly_rate || 0;
  const dailyRate = hourlyRate * overtimeSettings.regular_hours_per_day;

  const totalRegular = dayData.reduce((sum, d) => sum + d.regularHours, 0);
  const totalOvertime = dayData.reduce((sum, d) => sum + d.overtimeHours, 0);
  const grossRegular = totalRegular * hourlyRate;
  const grossOvertime = totalOvertime * hourlyRate * overtimeSettings.overtime_multiplier;
  const totalPay = grossRegular + grossOvertime;

  const navigateMonth = (dir: 1 | -1) => {
    setRefDate(dir === 1 ? addMonths(refDate, 1) : subMonths(refDate, 1));
  };

  const handleDownloadExcel = () => {
    if (!employee) return;
    exportPayrollToExcel({
      employeeName: `${employee.first_name} ${employee.last_name}`,
      periodLabel: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
      dailyRate,
      hourlyRate,
      grossRegular,
      grossOvertime,
      totalPay,
      totalRegular,
      totalOvertime,
      overtimeMultiplier: overtimeSettings.overtime_multiplier,
      dayData,
    });
  };

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="w-5 h-5 text-primary flex items-center justify-center">₱</span>
            Payroll — {employee.first_name} {employee.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Period Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[120px] text-center">
                {format(refDate, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Select value={cutoff} onValueChange={(v) => setCutoff(v as CutoffPeriod)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">1st – 15th Cutoff</SelectItem>
                <SelectItem value="second">16th – End of Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Period Info + Download */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Period: {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
            </Badge>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              <DollarSign className="w-3 h-3 mr-1" />
              Payday: {format(payday, 'EEEE, MMM d, yyyy')}
            </Badge>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                disabled={loading || dayData.every(d => d.totalHoursMs === 0)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
            </div>
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
                              <span className={isSatSun ? 'text-muted-foreground' : ''}>
                                {d.dayName}
                              </span>
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
                        <TableCell colSpan={4} className="text-xs font-bold text-primary">TOTAL</TableCell>
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
      </SheetContent>
    </Sheet>
  );
}
