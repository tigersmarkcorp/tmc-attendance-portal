import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer } from 'lucide-react';
import { getPhilippineTodayStart, getPhilippineTodayEnd } from '@/lib/philippineTime';

interface TimeEntry {
  entry_type: string;
  timestamp: string;
}

interface DailyTimeDisplayProps {
  entityType: 'employee' | 'worker';
  entityId: string;
  showLabel?: boolean;
}

export function DailyTimeDisplay({ entityType, entityId, showLabel = false }: DailyTimeDisplayProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEntries = async () => {
    const todayStart = getPhilippineTodayStart();
    const todayEnd = getPhilippineTodayEnd();

    if (entityType === 'employee') {
      const { data } = await supabase
        .from('time_entries')
        .select('entry_type, timestamp')
        .eq('employee_id', entityId)
        .gte('timestamp', todayStart)
        .lte('timestamp', todayEnd)
        .order('timestamp', { ascending: true });
      if (data) setEntries(data);
    } else {
      const { data } = await supabase
        .from('worker_time_entries')
        .select('entry_type, timestamp')
        .eq('worker_id', entityId)
        .gte('timestamp', todayStart)
        .lte('timestamp', todayEnd)
        .order('timestamp', { ascending: true });
      if (data) setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();

    const tableName = entityType === 'employee' ? 'time_entries' : 'worker_time_entries';
    const channel = supabase
      .channel(`daily-time-${entityType}-${entityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [entityId, entityType]);

  // Calculate elapsed time every second
  useEffect(() => {
    const calculate = () => {
      if (entries.length === 0) {
        setElapsed({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      let totalMs = 0;
      let clockInTime: Date | null = null;
      let breakStartTime: Date | null = null;
      let breakMs = 0;

      for (const entry of entries) {
        const ts = new Date(entry.timestamp);
        switch (entry.entry_type) {
          case 'clock_in':
            clockInTime = ts;
            breakMs = 0;
            breakStartTime = null;
            break;
          case 'break_start':
            breakStartTime = ts;
            break;
          case 'break_end':
            if (breakStartTime) {
              breakMs += ts.getTime() - breakStartTime.getTime();
              breakStartTime = null;
            }
            break;
          case 'clock_out':
            if (clockInTime) {
              let workTime = ts.getTime() - clockInTime.getTime() - breakMs;
              if (breakStartTime) {
                // Was on break when clocked out
                breakMs += ts.getTime() - breakStartTime.getTime();
                workTime = ts.getTime() - clockInTime.getTime() - breakMs;
                breakStartTime = null;
              }
              totalMs += Math.max(0, workTime);
              clockInTime = null;
              breakMs = 0;
            }
            break;
        }
      }

      // If still clocked in (no clock_out yet)
      if (clockInTime) {
        const now = new Date();
        let currentBreak = 0;
        if (breakStartTime) {
          currentBreak = now.getTime() - breakStartTime.getTime();
        }
        totalMs += Math.max(0, now.getTime() - clockInTime.getTime() - breakMs - currentBreak);
      }

      const totalSeconds = Math.floor(totalMs / 1000);
      setElapsed({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        total: totalSeconds,
      });
    };

    calculate();
    tickRef.current = setInterval(calculate, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [entries]);

  if (loading) {
    return <Badge variant="outline" className="animate-pulse text-xs">...</Badge>;
  }

  if (entries.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">—</span>
    );
  }

  const lastEntry = entries[entries.length - 1];
  const isActive = lastEntry.entry_type === 'clock_in' || lastEntry.entry_type === 'break_end';
  const isOnBreak = lastEntry.entry_type === 'break_start';
  const isClockedOut = lastEntry.entry_type === 'clock_out';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(elapsed.hours)}:${pad(elapsed.minutes)}:${pad(elapsed.seconds)}`;

  return (
    <div className="flex flex-col gap-0.5">
      <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${
        isActive ? 'text-success' : isOnBreak ? 'text-warning' : 'text-foreground'
      }`}>
        {isActive && <Timer className="w-3.5 h-3.5 animate-pulse" />}
        {isOnBreak && <Clock className="w-3.5 h-3.5 animate-pulse" />}
        {isClockedOut && <Clock className="w-3.5 h-3.5" />}
        {timeStr}
      </div>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground">
          {isActive ? 'Working' : isOnBreak ? 'On Break' : 'Completed'}
        </span>
      )}
    </div>
  );
}