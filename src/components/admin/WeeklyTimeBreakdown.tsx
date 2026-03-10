import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, ChevronLeft, CalendarIcon, Timer } from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths,
} from 'date-fns';
import { formatPHTime } from '@/lib/philippineTime';

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
}

interface WeeklyTimeBreakdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'employee' | 'worker';
  entityId: string;
  entityName: string;
}

function calculateDayTime(entries: TimeEntry[]): number {
  let totalMs = 0;
  let clockInTime: Date | null = null;
  let breakStartTime: Date | null = null;
  let breakMs = 0;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    switch (entry.entry_type) {
      case 'clock_in':
        clockInTime = ts; breakMs = 0; breakStartTime = null; break;
      case 'break_start':
        breakStartTime = ts; break;
      case 'break_end':
        if (breakStartTime) { breakMs += ts.getTime() - breakStartTime.getTime(); breakStartTime = null; }
        break;
      case 'clock_out':
        if (clockInTime) {
          let workTime = ts.getTime() - clockInTime.getTime() - breakMs;
          if (breakStartTime) { breakMs += ts.getTime() - breakStartTime.getTime(); workTime = ts.getTime() - clockInTime.getTime() - breakMs; breakStartTime = null; }
          totalMs += Math.max(0, workTime); clockInTime = null; breakMs = 0;
        }
        break;
    }
  }
  if (clockInTime) {
    const now = new Date();
    let currentBreak = breakStartTime ? now.getTime() - breakStartTime.getTime() : 0;
    totalMs += Math.max(0, now.getTime() - clockInTime.getTime() - breakMs - currentBreak);
  }
  return totalMs;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

const entryTypeLabels: Record<string, { label: string; color: string }> = {
  clock_in: { label: '🟢 Clock In', color: 'text-success' },
  break_start: { label: '🟡 Break Start', color: 'text-warning' },
  break_end: { label: '🔵 Break End', color: 'text-blue-500' },
  clock_out: { label: '🔴 Clock Out', color: 'text-destructive' },
};

type ViewMode = 'week' | 'month' | 'custom';

export function WeeklyTimeBreakdown({ open, onOpenChange, entityType, entityId, entityName }: WeeklyTimeBreakdownProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [refDate, setRefDate] = useState(new Date());
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const getRange = (): { start: Date; end: Date } => {
    if (viewMode === 'week') {
      return { start: startOfWeek(refDate, { weekStartsOn: 1 }), end: endOfWeek(refDate, { weekStartsOn: 1 }) };
    } else if (viewMode === 'month') {
      return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
    } else {
      return { start: customRange.from || new Date(), end: customRange.to || customRange.from || new Date() };
    }
  };

  const { start: rangeStart, end: rangeEnd } = getRange();
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  useEffect(() => {
    if (!open) return;
    fetchEntries();
    const tableName = entityType === 'employee' ? 'time_entries' : 'worker_time_entries';
    const channel = supabase
      .channel(`time-breakdown-${entityType}-${entityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, entityId, entityType, viewMode, refDate, customRange.from, customRange.to]);

  const fetchEntries = async () => {
    setLoading(true);
    const startStr = new Date(format(rangeStart, 'yyyy-MM-dd') + 'T00:00:00+08:00').toISOString();
    const endStr = new Date(format(rangeEnd, 'yyyy-MM-dd') + 'T23:59:59+08:00').toISOString();

    if (entityType === 'employee') {
      const { data } = await supabase
        .from('time_entries')
        .select('id, entry_type, timestamp')
        .eq('employee_id', entityId)
        .gte('timestamp', startStr)
        .lte('timestamp', endStr)
        .order('timestamp', { ascending: true });
      if (data) setEntries(data);
    } else {
      const { data } = await supabase
        .from('worker_time_entries')
        .select('id, entry_type, timestamp')
        .eq('worker_id', entityId)
        .gte('timestamp', startStr)
        .lte('timestamp', endStr)
        .order('timestamp', { ascending: true });
      if (data) setEntries(data);
    }
    setLoading(false);
  };

  const getEntriesForDay = (day: Date) => entries.filter(e => {
    // Convert entry timestamp to PHT date string for comparison
    const entryPHDate = new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const dayStr = format(day, 'yyyy-MM-dd');
    return entryPHDate === dayStr;
  });

  const totalMs = days.reduce((sum, day) => sum + calculateDayTime(getEntriesForDay(day)), 0);

  const navigate = (dir: 1 | -1) => {
    if (viewMode === 'week') setRefDate(dir === 1 ? addWeeks(refDate, 1) : subWeeks(refDate, 1));
    else if (viewMode === 'month') setRefDate(dir === 1 ? addMonths(refDate, 1) : subMonths(refDate, 1));
  };

  const goToToday = () => setRefDate(new Date());

  const now = new Date();
  const rangeLabel = viewMode === 'week'
    ? `${format(rangeStart, 'MMM d')} – ${format(rangeEnd, 'MMM d, yyyy')}`
    : viewMode === 'month'
    ? format(refDate, 'MMMM yyyy')
    : customRange.from && customRange.to
    ? `${format(customRange.from, 'MMM d')} – ${format(customRange.to, 'MMM d, yyyy')}`
    : 'Select date range';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Time Breakdown — {entityName}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); setRefDate(new Date()); }}>
            <TabsList className="w-full">
              <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
              <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Navigation / Date Picker */}
          {viewMode !== 'custom' ? (
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{rangeLabel}</p>
                <Button variant="link" size="sm" className="text-xs h-auto p-0 text-primary" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="w-4 h-4 rotate-0" style={{ transform: 'none' }} />
              </Button>
            </div>
          ) : (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customRange.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customRange.from && customRange.to ? { from: customRange.from, to: customRange.to } : undefined}
                  onSelect={(range) => {
                    setCustomRange({ from: range?.from, to: range?.to });
                    if (range?.from && range?.to) setCalendarOpen(false);
                  }}
                  numberOfMonths={1}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Period Total */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">
                  {viewMode === 'week' ? 'Week' : viewMode === 'month' ? 'Month' : 'Period'} Total
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-primary">{formatDuration(totalMs)}</span>
                <p className="text-[10px] text-muted-foreground">{days.filter(d => getEntriesForDay(d).length > 0).length} days worked</p>
              </div>
            </CardContent>
          </Card>

          {/* Days List */}
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <div className="space-y-1.5">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEntries = getEntriesForDay(day);
                const dayMs = calculateDayTime(dayEntries);
                const isOpen = openDays[key] || false;
                const today = isSameDay(day, now);

                return (
                  <Collapsible key={key} open={isOpen} onOpenChange={() => setOpenDays(prev => ({ ...prev, [key]: !prev[key] }))}>
                    <CollapsibleTrigger asChild>
                      <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${today ? 'border-primary/40 bg-primary/5' : ''}`}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <div>
                              <p className={`text-sm font-medium ${today ? 'text-primary' : 'text-foreground'}`}>
                                {format(day, 'EEEE')}
                                {today && <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-primary/30 text-primary">Today</Badge>}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{format(day, 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {dayEntries.length > 0 ? (
                              <span className={`font-mono text-sm font-bold ${today ? 'text-primary' : 'text-foreground'}`}>{formatDuration(dayMs)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            {dayEntries.length > 0 && <p className="text-[10px] text-muted-foreground">{dayEntries.length} entries</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {dayEntries.length > 0 ? (
                        <div className="ml-6 mr-2 mb-2 mt-1 border-l-2 border-primary/20 pl-4 space-y-1.5">
                          {dayEntries.map((entry) => {
                            const meta = entryTypeLabels[entry.entry_type] || { label: entry.entry_type, color: 'text-foreground' };
                            return (
                              <div key={entry.id} className="flex items-center justify-between py-1">
                                <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                                <span className="font-mono text-xs text-muted-foreground">{formatPHTime(new Date(entry.timestamp))}</span>
                              </div>
                            );
                          })}
                          <div className="pt-1.5 border-t border-border flex justify-between">
                            <span className="text-[11px] text-muted-foreground font-semibold">Total Work Time</span>
                            <span className="font-mono text-xs font-bold text-foreground">{formatDuration(dayMs)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-6 mr-2 mb-2 mt-1 pl-4">
                          <p className="text-xs text-muted-foreground italic">No time entries</p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
