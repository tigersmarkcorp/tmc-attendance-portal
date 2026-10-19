import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogIn, LogOut, MoonStar, Clock } from 'lucide-react';
import { calculateDayPayroll, getPayrollFetchRange, PayrollTimeEntry } from '@/lib/payrollDayCalc';

interface Props {
  workerId: string;
  days?: number;
}

export function WorkerAttendanceLog({ workerId, days = 14 }: Props) {
  const [entries, setEntries] = useState<PayrollTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const end = new Date();
      const start = subDays(end, days - 1);
      const { startStr, endStr } = getPayrollFetchRange(start, end);

      const { data } = await supabase
        .from('worker_time_entries')
        .select('id, entry_type, timestamp')
        .eq('worker_id', workerId)
        .gte('timestamp', startStr)
        .lte('timestamp', endStr)
        .order('timestamp', { ascending: true });

      if (!active) return;
      setEntries(data || []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`worker-attendance-log-${workerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_time_entries', filter: `worker_id=eq.${workerId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [workerId, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading attendance...
      </div>
    );
  }

  const end = new Date();
  const start = subDays(end, days - 1);
  const dayList = eachDayOfInterval({ start, end }).reverse();

  const rows = dayList.map((day) => ({ day, calc: calculateDayPayroll(entries, day, 8) }));
  const worked = rows.filter((r) => r.calc.totalMs > 0 || r.calc.timeIn || r.calc.timeOut);

  if (worked.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No attendance records in the last {days} days.</p>;
  }

  return (
    <div className="space-y-2">
      {worked.map(({ day, calc }) => {
        const totalMinutes = Math.round(calc.totalMs / 60000);
        return (
          <div key={format(day, 'yyyy-MM-dd')} className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{format(day, 'EEE, MMM d, yyyy')}</p>
              <Badge variant="outline" className="text-[10px]">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {calc.carriedIn && (
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                  <MoonStar className="w-3 h-3 mr-1" />
                  From previous day
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">
                <LogIn className="w-3 h-3 mr-1" />
                In: {calc.timeIn ?? '—'}
              </Badge>
              <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                <LogOut className="w-3 h-3 mr-1" />
                Out: {calc.timeOut ?? '—'}
              </Badge>
              {calc.carriedOut && (
                <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                  <MoonStar className="w-3 h-3 mr-1" />
                  Continues next day
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
