import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Clock, Coffee, LogIn, LogOut, Search, Loader2, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    employee_id: string;
  };
}

const entryTypeConfig = {
  clock_in: { label: 'Clock In', icon: LogIn, className: 'status-clocked-in' },
  break_start: { label: 'Break Start', icon: Coffee, className: 'status-on-break' },
  break_end: { label: 'Break End', icon: Clock, className: 'status-clocked-in' },
  clock_out: { label: 'Clock Out', icon: LogOut, className: 'status-clocked-out' },
};

export default function Attendance() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);

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
            department,
            employee_id
          )
        `)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });

      if (data) {
        setEntries(data as unknown as TimeEntry[]);
      }
      setLoading(false);
    };

    fetchEntries();

    const channel = supabase
      .channel('attendance-realtime')
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
                department,
                employee_id
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setEntries((prev) => [data as unknown as TimeEntry, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredEntries = entries.filter(
    (entry) =>
      entry.employees.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.employees.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.employees.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Today's Attendance">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['clock_in', 'break_start', 'break_end', 'clock_out'].map((type) => {
            const config = entryTypeConfig[type as keyof typeof entryTypeConfig];
            const count = entries.filter((e) => e.entry_type === type).length;
            const Icon = config.icon;
            return (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.className}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              Real-time Attendance Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No attendance records for today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Selfie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => {
                      const config = entryTypeConfig[entry.entry_type];
                      const Icon = config.icon;
                      return (
                        <TableRow key={entry.id} className="animate-fade-in">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={entry.employees.photo_url || ''} />
                                <AvatarFallback className="gradient-primary text-primary-foreground">
                                  {entry.employees.first_name[0]}
                                  {entry.employees.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {entry.employees.first_name} {entry.employees.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.employees.employee_id}
                          </TableCell>
                          <TableCell>{entry.employees.department || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={config.className}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(entry.timestamp), 'HH:mm:ss')}</TableCell>
                          <TableCell>
                            {entry.selfie_url ? (
                              <button
                                onClick={() => setSelectedSelfie(entry.selfie_url)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                              >
                                <Image className="w-5 h-5 text-primary" />
                              </button>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selfie Dialog */}
        <Dialog open={!!selectedSelfie} onOpenChange={() => setSelectedSelfie(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verification Selfie</DialogTitle>
            </DialogHeader>
            {selectedSelfie && (
              <img
                src={selectedSelfie}
                alt="Verification selfie"
                className="w-full rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
