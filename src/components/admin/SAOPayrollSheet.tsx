import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ChevronLeft, ChevronRight, Calendar, CheckCircle, Download, Wallet } from 'lucide-react';
import { format, eachDayOfInterval, addDays, previousThursday, isThursday, subWeeks, startOfDay, isWeekend } from 'date-fns';
import { formatPHTime } from '@/lib/philippineTime';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { exportPayrollToExcel } from '@/lib/exportPayroll';
import { CashAdvanceDialog, type CashAdvance } from './CashAdvanceDialog';

interface TimeEntry { id: string; entry_type: string; timestamp: string; }

interface SAOPayrollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: { id: string; first_name: string; last_name: string; hourly_rate: number; } | null;
}

interface DayPayrollData {
  date: Date;
  dayName: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHoursMs: number;
  regularHours: number;
  overtimeHours: number;
  lateMinutes: number;
  lateDeduction: number;
}

interface PayPeriod { start: Date; end: Date; label: string; }

function getPayPeriods(count: number = 8): PayPeriod[] {
  const periods: PayPeriod[] = [];
  const today = startOfDay(new Date());
  let currentStart = isThursday(today) ? today : previousThursday(today);
  for (let i = 0; i < count; i++) {
    const start = currentStart;
    const end = addDays(start, 6);
    periods.push({ start, end, label: `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}` });
    currentStart = subWeeks(currentStart, 1);
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
        clockInTime = ts; breakMs = 0; breakStartTime = null;
        if (!firstClockIn) firstClockIn = ts;
        break;
      case 'break_start': breakStartTime = ts; break;
      case 'break_end':
        if (breakStartTime) { breakMs += ts.getTime() - breakStartTime.getTime(); breakStartTime = null; }
        break;
      case 'clock_out':
        if (clockInTime) {
          let workTime = ts.getTime() - clockInTime.getTime() - breakMs;
          if (breakStartTime) { breakMs += ts.getTime() - breakStartTime.getTime(); workTime = ts.getTime() - clockInTime.getTime() - breakMs; breakStartTime = null; }
          totalMs += Math.max(0, workTime);
          lastClockOut = ts; clockInTime = null; breakMs = 0;
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
  return {
    totalMs,
    regularHours: Math.min(totalHours, regularHoursPerDay),
    overtimeHours: Math.max(0, totalHours - regularHoursPerDay),
    timeIn: firstClockIn ? formatPHTime(firstClockIn) : null,
    timeOut: lastClockOut ? formatPHTime(lastClockOut) : null,
  };
}

export function SAOPayrollSheet({ open, onOpenChange, employee }: SAOPayrollSheetProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [lateMap, setLateMap] = useState<Record<string, number>>({});
  const [lateInputs, setLateInputs] = useState<Record<string, string>>({});
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [caDialogOpen, setCaDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payPeriods] = useState<PayPeriod[]>(getPayPeriods(8));
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [regularHoursPerDay, setRegularHoursPerDay] = useState(8);
  const { toast } = useToast();

  const selectedPeriod = payPeriods[selectedPeriodIndex];
  const days = eachDayOfInterval({ start: selectedPeriod.start, end: selectedPeriod.end });
  const hourlyRate = employee?.hourly_rate || 0;
  const perMinuteRate = hourlyRate / 60;

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('overtime_settings').select('regular_hours_per_day').limit(1).single();
      if (data) setRegularHoursPerDay(Number(data.regular_hours_per_day));
    })();
  }, [open]);

  const fetchEntries = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    const startStr = new Date(format(selectedPeriod.start, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const endStr = new Date(format(selectedPeriod.end, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();
    const startDate = format(selectedPeriod.start, 'yyyy-MM-dd');
    const endDate = format(selectedPeriod.end, 'yyyy-MM-dd');

    const [teRes, lateRes, caRes] = await Promise.all([
      supabase.from('time_entries').select('id, entry_type, timestamp').eq('employee_id', employee.id).gte('timestamp', startStr).lte('timestamp', endStr).order('timestamp', { ascending: true }),
      (supabase as any).from('payroll_late_minutes').select('date, minutes').eq('employee_id', employee.id).gte('date', startDate).lte('date', endDate),
      (supabase as any).from('cash_advances').select('id, description, amount, created_at').eq('employee_id', employee.id).eq('period_start', startDate).eq('period_end', endDate).order('created_at', { ascending: false }),
    ]);

    if (teRes.data) setEntries(teRes.data);
    const lm: Record<string, number> = {};
    const li: Record<string, string> = {};
    (lateRes.data || []).forEach((r: any) => { lm[r.date] = Number(r.minutes || 0); li[r.date] = String(r.minutes || 0); });
    setLateMap(lm);
    setLateInputs(li);
    setCashAdvances((caRes.data || []) as CashAdvance[]);
    setLoading(false);
  }, [employee, selectedPeriod]);

  useEffect(() => {
    if (!open || !employee) return;
    fetchEntries();
    const channel = supabase
      .channel(`sao-payroll-${employee.id}-${selectedPeriodIndex}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: `employee_id=eq.${employee.id}` }, () => fetchEntries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_advances', filter: `employee_id=eq.${employee.id}` }, () => fetchEntries())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payroll_late_minutes', filter: `employee_id=eq.${employee.id}` }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, employee, selectedPeriodIndex, fetchEntries]);

  const getEntriesForDay = (day: Date) => entries.filter(e => {
    const entryPHDate = new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    return entryPHDate === format(day, 'yyyy-MM-dd');
  });

  const dayData: DayPayrollData[] = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayEntries = getEntriesForDay(day);
    const calc = calculateDayData(dayEntries, regularHoursPerDay);
    const lateMinutes = lateMap[dateStr] || 0;
    return {
      date: day,
      dayName: format(day, 'EEE'),
      timeIn: calc.timeIn,
      timeOut: calc.timeOut,
      totalHoursMs: calc.totalMs,
      regularHours: calc.regularHours,
      overtimeHours: calc.overtimeHours,
      lateMinutes,
      lateDeduction: lateMinutes * perMinuteRate,
    };
  });

  const dailyRate = hourlyRate * regularHoursPerDay;
  const totalRegular = dayData.reduce((s, d) => s + d.regularHours, 0);
  const totalOvertime = dayData.reduce((s, d) => s + d.overtimeHours, 0);
  const totalLateDeduction = dayData.reduce((s, d) => s + d.lateDeduction, 0);
  const totalCashAdvance = cashAdvances.reduce((s, a) => s + Number(a.amount || 0), 0);
  const grossRegular = totalRegular * hourlyRate;
  // OT rate = hourly rate (multiplier 1)
  const grossOvertime = totalOvertime * hourlyRate;
  const totalPay = grossRegular + grossOvertime - totalLateDeduction - totalCashAdvance;
  const daysWorked = dayData.filter(d => d.totalHoursMs > 0).length;

  const navigatePeriod = (dir: 1 | -1) => {
    const next = selectedPeriodIndex + dir;
    if (next >= 0 && next < payPeriods.length) setSelectedPeriodIndex(next);
  };

  const saveLateMinutes = async (dateStr: string, rawValue: string) => {
    if (!employee) return;
    const parsed = Math.max(0, Math.floor(Number(rawValue) || 0));
    if ((lateMap[dateStr] || 0) === parsed) return;
    const payload: any = { employee_id: employee.id, date: dateStr, minutes: parsed };
    const { error } = await (supabase as any)
      .from('payroll_late_minutes')
      .upsert(payload, { onConflict: 'employee_id,date' });
    if (error) {
      toast({ title: 'Failed to save late minutes', description: error.message, variant: 'destructive' });
      return;
    }
    setLateMap(prev => ({ ...prev, [dateStr]: parsed }));
  };

  const handleGeneratePayroll = async () => {
    if (!employee) return;
    setGenerating(true);
    try {
      for (const d of dayData) {
        if (d.totalHoursMs <= 0 && d.lateMinutes <= 0) continue;
        const dateStr = format(d.date, 'yyyy-MM-dd');
        const totalWorkMinutes = Math.round(d.totalHoursMs / (1000 * 60));
        const regPay = d.regularHours * hourlyRate;
        const otPay = d.overtimeHours * hourlyRate; // OT = hourly rate
        const dayTotalPay = regPay + otPay - d.lateDeduction;

        const { data: existing } = await supabase.from('timesheets').select('id').eq('employee_id', employee.id).eq('date', dateStr).maybeSingle();
        const timesheetData = {
          employee_id: employee.id,
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
        if (existing) await supabase.from('timesheets').update(timesheetData).eq('id', existing.id);
        else await supabase.from('timesheets').insert(timesheetData);
      }
      toast({ title: 'Payroll Generated', description: `Payroll for ${employee.first_name} ${employee.last_name} — ${selectedPeriod.label}. Net: ${formatCurrency(totalPay)}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate payroll.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!employee) return;
    exportPayrollToExcel({
      employeeName: `${employee.first_name} ${employee.last_name}`,
      periodLabel: selectedPeriod.label,
      dailyRate, hourlyRate,
      grossRegular, grossOvertime, totalPay,
      totalRegular, totalOvertime,
      overtimeMultiplier: 1,
      dayData,
      totalLateDeduction,
      totalCashAdvance,
      cashAdvances: cashAdvances.map(a => ({ description: a.description, amount: Number(a.amount), created_at: a.created_at })),
    });
  };

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="w-4 h-4 mr-2 text-success flex items-center justify-center">₱</span>
            Payroll — {employee.first_name} {employee.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
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
            <Badge variant="outline" className="text-xs"><Calendar className="w-3 h-3 mr-1" />Thursday – Wednesday Cycle</Badge>
            <Badge variant="secondary" className="text-xs">OT rate = hourly ({formatCurrency(hourlyRate)}/hr)</Badge>
            <Badge variant="secondary" className="text-xs">Late = {formatCurrency(perMinuteRate)}/min</Badge>
          </div>

          <div className="flex justify-end gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setCaDialogOpen(true)} className="gap-2 border-orange-500/50 text-orange-600 hover:bg-orange-500/10">
              <Wallet className="w-4 h-4" />
              CA{cashAdvances.length > 0 && ` (${cashAdvances.length})`}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={loading || (daysWorked === 0 && cashAdvances.length === 0)} className="gap-2">
              <Download className="w-4 h-4" />Download Excel
            </Button>
            <Button onClick={handleGeneratePayroll} disabled={generating || daysWorked === 0} className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Generate Payroll
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <Card className="border-0 shadow-soft"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Rate</p><p className="text-sm font-bold">{formatCurrency(dailyRate)}</p></CardContent></Card>
            <Card className="border-0 shadow-soft"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hourly</p><p className="text-sm font-bold">{formatCurrency(hourlyRate)}/hr</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross Pay</p><p className="text-sm font-bold text-success">{formatCurrency(grossRegular)}</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-warning/5 to-warning/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overtime</p><p className="text-sm font-bold text-warning">{formatCurrency(grossOvertime)}</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-destructive/5 to-destructive/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deductions</p><p className="text-sm font-bold text-destructive">−{formatCurrency(totalLateDeduction + totalCashAdvance)}</p><p className="text-[9px] text-muted-foreground">Late + CA</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">NET Total</p><p className="text-sm font-bold text-primary">{formatCurrency(totalPay)}</p></CardContent></Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
          ) : (
            <Card className="border-0 shadow-soft overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold text-xs">Date</TableHead>
                        <TableHead className="font-semibold text-xs">Day</TableHead>
                        <TableHead className="font-semibold text-xs">In</TableHead>
                        <TableHead className="font-semibold text-xs">Out</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Total</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Reg</TableHead>
                        <TableHead className="font-semibold text-xs text-right">OT</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Late (min)</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Late Ded</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayData.map((d) => {
                        const dateStr = format(d.date, 'yyyy-MM-dd');
                        const totalHours = d.totalHoursMs / (1000 * 60 * 60);
                        const dayPay = d.regularHours * hourlyRate + d.overtimeHours * hourlyRate - d.lateDeduction;
                        const isSatSun = isWeekend(d.date);
                        return (
                          <TableRow key={dateStr} className={isSatSun ? 'bg-muted/30' : ''}>
                            <TableCell className="text-xs font-medium">{format(d.date, 'MMM d')}</TableCell>
                            <TableCell className="text-xs"><span className={isSatSun ? 'text-muted-foreground' : ''}>{d.dayName}</span></TableCell>
                            <TableCell className="text-xs font-mono">{d.timeIn || '—'}</TableCell>
                            <TableCell className="text-xs font-mono">{d.timeOut || '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{totalHours > 0 ? totalHours.toFixed(2) : '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{d.regularHours > 0 ? d.regularHours.toFixed(2) : '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{d.overtimeHours > 0 ? <span className="text-warning font-semibold">{d.overtimeHours.toFixed(2)}</span> : '—'}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                value={lateInputs[dateStr] ?? ''}
                                onChange={(e) => setLateInputs(prev => ({ ...prev, [dateStr]: e.target.value }))}
                                onBlur={(e) => saveLateMinutes(dateStr, e.target.value)}
                                className="h-7 w-16 ml-auto text-xs font-mono text-right"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className="text-xs font-mono text-right">{d.lateDeduction > 0 ? <span className="text-destructive font-semibold">−{formatCurrency(d.lateDeduction)}</span> : '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right font-semibold">{dayPay !== 0 ? formatCurrency(dayPay) : '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-violet-500/5 font-bold border-t-2 border-violet-500/20">
                        <TableCell colSpan={4} className="text-xs font-bold text-violet-600">TOTAL ({daysWorked} days)</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold">{(totalRegular + totalOvertime).toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold">{totalRegular.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-warning">{totalOvertime.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold">{dayData.reduce((s, d) => s + d.lateMinutes, 0)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-destructive">−{formatCurrency(totalLateDeduction)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-primary">{formatCurrency(grossRegular + grossOvertime - totalLateDeduction)}</TableCell>
                      </TableRow>
                      {totalCashAdvance > 0 && (
                        <TableRow className="bg-orange-500/5">
                          <TableCell colSpan={9} className="text-xs font-semibold text-orange-600">Cash Advance Deductions ({cashAdvances.length})</TableCell>
                          <TableCell className="text-xs font-mono text-right font-bold text-orange-600">−{formatCurrency(totalCashAdvance)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-primary/10 border-t-2 border-primary/30">
                        <TableCell colSpan={9} className="text-sm font-bold text-primary">NET TOTAL PAY</TableCell>
                        <TableCell className="text-sm font-mono text-right font-bold text-primary">{formatCurrency(totalPay)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <CashAdvanceDialog
          open={caDialogOpen}
          onOpenChange={setCaDialogOpen}
          subjectType="employee"
          subjectId={employee.id}
          subjectName={`${employee.first_name} ${employee.last_name}`}
          periodStart={selectedPeriod.start}
          periodEnd={selectedPeriod.end}
          periodLabel={selectedPeriod.label}
          advances={cashAdvances}
          onChanged={fetchEntries}
        />
      </SheetContent>
    </Sheet>
  );
}
