import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  entry_type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out';
  timestamp: string;
  selfie_url: string | null;
  employees: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
    department: string | null;
  };
}

const entryTypeConfig = {
  clock_in: { label: 'Clocked In', icon: LogIn, className: 'status-clocked-in' },
  break_start: { label: 'On Break', icon: Coffee, className: 'status-on-break' },
  break_end: { label: 'Back from Break', icon: Clock, className: 'status-clocked-in' },
  clock_out: { label: 'Clocked Out', icon: LogOut, className: 'status-clocked-out' },
};

export function RealTimeAttendance() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('time_entries')
        .select(`
          id,
          entry_type,
          timestamp,
          selfie_url,
          employees (
            first_name,
            last_name,
            photo_url,
            department
          )
        `)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      if (data) {
        setEntries(data as unknown as TimeEntry[]);
      }
      setLoading(false);
    };

    fetchEntries();

    const channel = supabase
      .channel('time-entries-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'time_entries',
        },
        async (payload) => {
          const { data } = await supabase
            .from('time_entries')
            .select(`
              id,
              entry_type,
              timestamp,
              selfie_url,
              employees (
                first_name,
                last_name,
                photo_url,
                department
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setEntries((prev) => [data as unknown as TimeEntry, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity today yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const config = entryTypeConfig[entry.entry_type];
              const Icon = config.icon;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 animate-slide-up"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.employees.photo_url || ''} />
                    <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
                      {entry.employees.first_name[0]}{entry.employees.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.employees.first_name} {entry.employees.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.employees.department || 'No department'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={config.className}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
