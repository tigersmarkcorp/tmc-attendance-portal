import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, ChevronLeft, ChevronRight, FileText, Download, MapPin } from 'lucide-react';
import { format, eachDayOfInterval, endOfMonth, getDay, subDays, addMonths, subMonths, isWeekend } from 'date-fns';
import { calculateDayPayroll, getPayrollFetchRange } from '@/lib/payrollDayCalc';
import { formatCurrency } from '@/lib/currency';
import { exportPayrollToExcel } from '@/lib/exportPayroll';
import { exportPayrollToPdf } from '@/lib/exportPayrollPdf';

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
  location?: string | null;
}

interface EmployeePayrollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    employee_id?: string;
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
  timeInDate: string | null;
  timeOutDate: string | null;
  totalHoursMs: number;
  regularHours: number;
  overtimeHours: number;
  locationIn: string | null;
  locationOut: string | null;
}

type CutoffPeriod = 'first' | 'second';

function getPayday(year: number, month: number, period: CutoffPeriod): Date {
  let payday: Date;
  if (period === 'first') {
    payday = new Date(year, month, 15);
  } else {
    payday = endOfMonth(new Date(year, month, 1));
  }
  const dow = getDay(payday);
  if (dow === 6) payday = subDays(payday, 1);
  if (dow === 0) payday = subDays(payday, 2);
  return payday;
}

function getCutoffRange(year: number, month: number, period: CutoffPeriod): { start: Date; end: Date } {
  if (period === 'first') {
    return { start: new Date(year, month, 1), end: new Date(year, month, 15) };
  }
  return { start: new Date(year, month, 16), end: endOfMonth(new Date(year, month, 1)) };
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: `employee_id=eq.${employee.id}` }, () => fetchEntries())
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
    // Overnight-aware fetch: expand by one day on each side so sessions crossing boundaries are complete
    const { startStr, endStr } = getPayrollFetchRange(start, end);

    const { data } = await supabase
      .from('time_entries')
      .select('id, entry_type, timestamp, location')
      .eq('employee_id', employee.id)
      .gte('timestamp', startStr)
      .lte('timestamp', endStr)
      .order('timestamp', { ascending: true });

    if (data) setEntries(data);

    setLoading(false);
  };

  const regularHoursPerDay = 8;

  const dayData: DayPayrollData[] = days.map(day => {
    const calc = calculateDayPayroll(entries, day, regularHoursPerDay);
    return {
      date: day,
      dayName: format(day, 'EEE'),
      timeIn: calc.timeIn,
      timeOut: calc.timeOut,
      timeInDate: calc.timeInDate,
      timeOutDate: calc.timeOutDate,
      totalHoursMs: calc.totalMs,
      regularHours: calc.regularHours,
      overtimeHours: calc.overtimeHours,
      locationIn: calc.locationIn,
      locationOut: calc.locationOut,
    };
  });

  const hourlyRate = employee?.hourly_rate || 0;
  const dailyRate = hourlyRate * regularHoursPerDay;

  const totalRegular = dayData.reduce((sum, d) => sum + d.regularHours, 0);
  const totalOvertime = dayData.reduce((sum, d) => sum + d.overtimeHours, 0);
  const grossRegular = totalRegular * hourlyRate;
  const grossOvertime = totalOvertime * hourlyRate * overtimeSettings.overtime_multiplier;
  const totalPay = grossRegular + grossOvertime;

  const navigateMonth = (dir: 1 | -1) => {
    setRefDate(dir === 1 ? addMonths(refDate, 1) : subMonths(refDate, 1));
  };

  const handleDownloadPdf = () => {
    if (!employee) return;
    exportPayrollToPdf({ name: `${employee.first_name} ${employee.last_name}`, idNumber: employee.employee_id ?? '-', employeeType: 'Employee', hourlyRate, periodLabel: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`, days: dayData, totalPay });
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
      <SheetContent className="w-full sm:max-w-6xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Payroll — {employee.first_name} {employee.last_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
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

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Period: {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')}
            </Badge>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              <DollarSign className="w-3 h-3 mr-1" />
              Payday: {format(payday, 'EEEE, MMM d, yyyy')}
            </Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={loading || dayData.every(d => d.totalHoursMs === 0)} className="gap-2"><FileText className="w-4 h-4" />Download PDF</Button>
              <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={loading || dayData.every(d => d.totalHoursMs === 0)} className="gap-2">
                <Download className="w-4 h-4" />Download Excel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="border-0 shadow-soft"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Rate</p><p className="text-sm font-bold text-foreground">{formatCurrency(dailyRate)}</p></CardContent></Card>
            <Card className="border-0 shadow-soft"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hourly Rate</p><p className="text-sm font-bold text-foreground">{formatCurrency(hourlyRate)}/hr</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gross Pay</p><p className="text-sm font-bold text-success">{formatCurrency(grossRegular)}</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-warning/5 to-warning/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Overtime Pay</p><p className="text-sm font-bold text-warning">{formatCurrency(grossOvertime)}</p></CardContent></Card>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10"><CardContent className="p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Pay</p><p className="text-sm font-bold text-primary">{formatCurrency(totalPay)}</p></CardContent></Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
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
                        <TableHead className="font-semibold text-xs">Location In</TableHead>
                        <TableHead className="font-semibold text-xs">Location Out</TableHead>
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
                        const dateStr = format(d.date, 'yyyy-MM-dd');

                        return (
                          <TableRow key={dateStr} className={isSatSun ? 'bg-muted/30' : ''}>
                            <TableCell className="text-xs font-medium">{format(d.date, 'MMM d')}</TableCell>
                            <TableCell className="text-xs"><span className={isSatSun ? 'text-muted-foreground' : ''}>{d.dayName}</span></TableCell>
                            <TableCell className="text-xs font-mono">
                              {d.timeIn ? (
                                <div className="flex flex-col leading-tight">
                                  <span>{d.timeIn}</span>
                                  {d.timeInDate && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {format(new Date(d.timeInDate + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                                    </span>
                                  )}
                                </div>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {d.timeOut ? (
                                <div className="flex flex-col leading-tight">
                                  <span>{d.timeOut}</span>
                                  {d.timeOutDate && (
                                    <span className={`text-[10px] ${d.timeOutDate !== dateStr ? 'text-warning' : 'text-muted-foreground'}`}>
                                      {format(new Date(d.timeOutDate + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                                    </span>
                                  )}
                                </div>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {d.locationIn ? (
                                <span className="flex items-start gap-1 text-[11px] text-success min-w-[120px]">
                                  <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{d.locationIn}</span>
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs">
                              {d.locationOut ? (
                                <span className="flex items-start gap-1 text-[11px] text-destructive min-w-[120px]">
                                  <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{d.locationOut}</span>
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-right">{totalHours > 0 ? totalHours.toFixed(2) : '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{d.regularHours > 0 ? d.regularHours.toFixed(2) : '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right">{d.overtimeHours > 0 ? <span className="text-warning font-semibold">{d.overtimeHours.toFixed(2)}</span> : '—'}</TableCell>
                            <TableCell className="text-xs font-mono text-right font-semibold">{dayPay > 0 ? formatCurrency(dayPay) : '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                        <TableCell colSpan={6} className="text-xs font-bold text-primary">TOTAL</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold">{(totalRegular + totalOvertime).toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold">{totalRegular.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-warning">{totalOvertime.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-right font-bold text-primary">{formatCurrency(totalPay)}</TableCell>
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
