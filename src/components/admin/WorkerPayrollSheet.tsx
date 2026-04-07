import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ChevronLeft, ChevronRight, Calendar, CheckCircle, Download } from 'lucide-react';
import { format, eachDayOfInterval, addDays, previousThursday, isThursday, subWeeks, startOfDay, isWeekend } from 'date-fns';
import { formatPHTime } from '@/lib/philippineTime';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { exportPayrollToExcel } from '@/lib/exportPayroll';

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
}

interface WorkerPayrollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: {
    id: string;
    first_name: string;
    last_name: string;
    hourly_rate: number | null;
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

interface PayPeriod {
  start: Date;
  end: Date;
  label: string;
}

function getPayPeriods(count: number = 8): PayPeriod[] {
  const periods: PayPeriod[] = [];
  const today = startOfDay(new Date());
  let currentStart = isThursday(today) ? today : previousThursday(today);

  for (let i = 0; i < count; i++) {
    const start = currentStart;
    const end = addDays(start, 6);
    periods.push({
      start,
      end,
      label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`,
    });
    currentStart = subWeeks(currentStart, 1);
  }
  return periods;
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

export function WorkerPayrollSheet({ open, onOpenChange, worker }: WorkerPayrollSheetProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payPeriods] = useState<PayPeriod[]>(getPayPeriods(8));
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [overtimeSettings, setOvertimeSettings] = useState({
    regular_hours_per_day: 8,
    overtime_multiplier: 1.5,
  });
  const { toast } = useToast();

  const selectedPeriod = payPeriods[selectedPeriodIndex];
  const days = eachDayOfInterval({ start: selectedPeriod.start, end: selectedPeriod.end });

  useEffect(() => {
    if (!open || !worker) return;
    fetchOvertimeSettings();
  }, [open, worker]);

  useEffect(() => {
    if (!open || !worker) return;
    fetchEntries();
    const channel = supabase
      .channel(`worker-payroll-${worker.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_time_entries' }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, worker?.id, selectedPeriodIndex]);

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
    if (!worker) return;
    setLoading(true);
    const startStr = new Date(format(selectedPeriod.start, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const endStr = new Date(format(selectedPeriod.end, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();

    const { data } = await supabase
      .from('worker_time_entries')
      .select('id, entry_type, timestamp')
      .eq('worker_id', worker.id)
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

  const hourlyRate = worker?.hourly_rate || 0;
  const dailyRate = hourlyRate * overtimeSettings.regular_hours_per_day;

  const totalRegular = dayData.reduce((sum, d) => sum + d.regularHours, 0);
  const totalOvertime = dayData.reduce((sum, d) => sum + d.overtimeHours, 0);
  const grossRegular = totalRegular * hourlyRate;
  const grossOvertime = totalOvertime * hourlyRate * overtimeSettings.overtime_multiplier;
  const totalPay = grossRegular + grossOvertime;
  const daysWorked = dayData.filter(d => d.totalHoursMs > 0).length;

  const navigatePeriod = (dir: 1 | -1) => {
    const next = selectedPeriodIndex + dir;
    if (next >= 0 && next < payPeriods.length) {
      setSelectedPeriodIndex(next);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!worker) return;
    setGenerating(true);
    try {
      for (const d of dayData) {
        if (d.totalHoursMs <= 0) continue;
        const dateStr = format(d.date, 'yyyy-MM-dd');
        const totalWorkMinutes = Math.round(d.totalHoursMs / (1000 * 60));
        const regPay = d.regularHours * hourlyRate;
        const otPay = d.overtimeHours * hourlyRate * overtimeSettings.overtime_multiplier;
        const dayTotalPay = regPay + otPay;

        const { data: existing } = await supabase
          .from('worker_timesheets')
          .select('id')
          .eq('worker_id', worker.id)
          .eq('date', dateStr)
          .maybeSingle();

        const timesheetData = {
          worker_id: worker.id,
          date: dateStr,
          total_work_minutes: totalWorkMinutes,
          hourly_rate: hourlyRate,
          regular_hours: d.regularHours,
          overtime_hours: d.overtimeHours,
          regular_pay: regPay,
          overtime_pay: otPay,
          total_pay: dayTotalPay,
          status: 'approved',
        };

        if (existing) {
          await supabase.from('worker_timesheets').update(timesheetData).eq('id', existing.id);
        } else {
          await supabase.from('worker_timesheets').insert(timesheetData);
        }
      }

      toast({
        title: 'Payroll Generated',
        description: `Payroll for ${worker.first_name} ${worker.last_name} has been generated for ${selectedPeriod.label}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payroll.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!worker) return;
    exportPayrollToExcel({
      employeeName: `${worker.first_name} ${worker.last_name}`,
      periodLabel: selectedPeriod.label,
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

  if (!worker) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            Payroll — {worker.first_name} {worker.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Period Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigatePeriod(1)} disabled={selectedPeriodIndex >= payPeriods.length - 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[200px] text-center">
                {selectedPeriod.label}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigatePeriod(-1)} disabled={selectedPeriodIndex <= 0}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Thursday – Wednesday Cycle
            </Badge>
          </div>

          {/* Generate Payroll & Download Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={loading || daysWorked === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </Button>
            <Button
              onClick={handleGeneratePayroll}
              disabled={generating || daysWorked === 0}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Generate Payroll
            </Button>
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
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
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
                      <TableRow className="bg-amber-500/5 font-bold border-t-2 border-amber-500/20">
                        <TableCell colSpan={4} className="text-xs font-bold text-amber-600">TOTAL ({daysWorked} days worked)</TableCell>
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
