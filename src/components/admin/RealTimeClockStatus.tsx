import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, Coffee, LogOut, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  entry_type: string;
  timestamp: string;
}

interface RealTimeClockStatusProps {
  entityType: 'employee' | 'worker';
  entityId: string;
}

export function RealTimeClockStatus({ entityType, entityId }: RealTimeClockStatusProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayEntries = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    if (entityType === 'employee') {
      const { data } = await supabase
        .from('time_entries')
        .select('entry_type, timestamp')
        .eq('employee_id', entityId)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: true });
      if (data) {
        setEntries(data);
      }
    } else {
      const { data } = await supabase
        .from('worker_time_entries')
        .select('entry_type, timestamp')
        .eq('worker_id', entityId)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: true });
      if (data) {
        setEntries(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTodayEntries();
    
    // Set up real-time subscription
    const tableName = entityType === 'employee' ? 'time_entries' : 'worker_time_entries';
    const columnName = entityType === 'employee' ? 'employee_id' : 'worker_id';
    
    const channel = supabase
      .channel(`${entityType}-${entityId}-clock`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `${columnName}=eq.${entityId}`,
        },
        () => {
          fetchTodayEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, entityType]);

  if (loading) {
    return <Badge variant="outline" className="animate-pulse">Loading...</Badge>;
  }

  if (entries.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Minus className="w-3 h-3 mr-1" />
        No entries
      </Badge>
    );
  }

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'clock_in': return LogIn;
      case 'clock_out': return LogOut;
      case 'break_start': 
      case 'break_end': return Coffee;
      default: return Clock;
    }
  };

  const getEntryLabel = (type: string) => {
    switch (type) {
      case 'clock_in': return 'In';
      case 'clock_out': return 'Out';
      case 'break_start': return 'Break';
      case 'break_end': return 'Back';
      default: return type;
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'clock_in': return 'bg-success/10 text-success border-success/20';
      case 'clock_out': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'break_start': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'break_end': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return '';
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((entry, idx) => {
        const Icon = getEntryIcon(entry.entry_type);
        const time = format(new Date(entry.timestamp), 'h:mm a');
        return (
          <Badge 
            key={idx} 
            variant="outline" 
            className={`text-[10px] px-1.5 py-0.5 ${getEntryColor(entry.entry_type)}`}
          >
            <Icon className="w-2.5 h-2.5 mr-0.5" />
            {getEntryLabel(entry.entry_type)} {time}
          </Badge>
        );
      })}
    </div>
  );
}
