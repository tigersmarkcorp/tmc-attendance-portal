import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MapPin, Users, Clock, LogIn, LogOut, Coffee, Minus, Activity, Shield } from 'lucide-react';
import { getPhilippineTodayStart, getPhilippineTodayEnd, formatPHTime } from '@/lib/philippineTime';

interface PersonEntry {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  position: string | null;
  role: 'sao' | 'worker';
  hourly_rate: number;
  entries: { entry_type: string; timestamp: string }[];
}

interface LocationData {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  personnel: PersonEntry[];
}

export function RealTimeLocationMonitor() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const todayStart = getPhilippineTodayStart();
    const todayEnd = getPhilippineTodayEnd();

    // Fetch all data in parallel
    const [locRes, empAssignRes, workerAssignRes, employeesRes, workersRes, timeEntriesRes, workerTimeEntriesRes, rolesRes] = await Promise.all([
      supabase.from('work_locations').select('id, name, address, is_active'),
      supabase.from('employee_location_assignments').select('employee_id, location_id'),
      supabase.from('worker_location_assignments').select('worker_id, location_id'),
      supabase.from('employees').select('id, first_name, last_name, photo_url, position, hourly_rate, user_id'),
      supabase.from('workers').select('id, first_name, last_name, photo_url, position, hourly_rate'),
      supabase.from('time_entries').select('employee_id, entry_type, timestamp')
        .gte('timestamp', todayStart).lte('timestamp', todayEnd).order('timestamp', { ascending: true }),
      supabase.from('worker_time_entries').select('worker_id, entry_type, timestamp')
        .gte('timestamp', todayStart).lte('timestamp', todayEnd).order('timestamp', { ascending: true }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (!locRes.data) return;

    // Build role lookup (to identify SAOs)
    const saoUserIds = new Set(
      (rolesRes.data || []).filter(r => r.role === 'site_admin_officer').map(r => r.user_id)
    );

    // Build employee entries map
    const empEntriesMap = new Map<string, { entry_type: string; timestamp: string }[]>();
    (timeEntriesRes.data || []).forEach(e => {
      if (!empEntriesMap.has(e.employee_id)) empEntriesMap.set(e.employee_id, []);
      empEntriesMap.get(e.employee_id)!.push({ entry_type: e.entry_type, timestamp: e.timestamp });
    });

    // Build worker entries map
    const workerEntriesMap = new Map<string, { entry_type: string; timestamp: string }[]>();
    (workerTimeEntriesRes.data || []).forEach(e => {
      if (!workerEntriesMap.has(e.worker_id)) workerEntriesMap.set(e.worker_id, []);
      workerEntriesMap.get(e.worker_id)!.push({ entry_type: e.entry_type, timestamp: e.timestamp });
    });

    // Build employee lookup
    const empMap = new Map((employeesRes.data || []).map(e => [e.id, e]));
    const workerMap = new Map((workersRes.data || []).map(w => [w.id, w]));

    // Build location data
    const locationData: LocationData[] = locRes.data.map(loc => {
      const personnel: PersonEntry[] = [];

      // Add assigned employees (SAOs)
      const empAssignments = (empAssignRes.data || []).filter(a => a.location_id === loc.id);
      empAssignments.forEach(a => {
        const emp = empMap.get(a.employee_id);
        if (!emp) return;
        const isSao = emp.user_id ? saoUserIds.has(emp.user_id) : false;
        personnel.push({
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          photo_url: emp.photo_url,
          position: emp.position,
          role: isSao ? 'sao' : 'sao', // employees assigned to locations are typically SAOs
          hourly_rate: emp.hourly_rate || 0,
          entries: empEntriesMap.get(emp.id) || [],
        });
      });

      // Add assigned workers
      const workerAssignments = (workerAssignRes.data || []).filter(a => a.location_id === loc.id);
      workerAssignments.forEach(a => {
        const worker = workerMap.get(a.worker_id);
        if (!worker) return;
        personnel.push({
          id: worker.id,
          first_name: worker.first_name,
          last_name: worker.last_name,
          photo_url: worker.photo_url,
          position: worker.position,
          role: 'worker',
          hourly_rate: worker.hourly_rate || 0,
          entries: workerEntriesMap.get(worker.id) || [],
        });
      });

      return { ...loc, personnel };
    });

    // Sort: locations with most personnel first
    locationData.sort((a, b) => b.personnel.length - a.personnel.length);

    setLocations(locationData);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('admin-location-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_time_entries' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_location_assignments' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_location_assignments' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getPersonStatus = (entries: { entry_type: string; timestamp: string }[]) => {
    if (entries.length === 0) return { status: 'absent', label: 'Not Clocked In', color: 'bg-muted text-muted-foreground' };
    const last = entries[entries.length - 1];
    switch (last.entry_type) {
      case 'clock_in': return { status: 'active', label: 'Clocked In', color: 'bg-success/15 text-success border-success/30' };
      case 'break_start': return { status: 'break', label: 'On Break', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' };
      case 'break_end': return { status: 'active', label: 'Working', color: 'bg-success/15 text-success border-success/30' };
      case 'clock_out': return { status: 'done', label: 'Clocked Out', color: 'bg-destructive/15 text-destructive border-destructive/30' };
      default: return { status: 'absent', label: 'Unknown', color: 'bg-muted text-muted-foreground' };
    }
  };

  const getWorkedHours = (entries: { entry_type: string; timestamp: string }[]) => {
    let totalMs = 0;
    let clockInTime: Date | null = null;
    let breakStartTime: Date | null = null;
    let totalBreakMs = 0;

    for (const entry of entries) {
      const t = new Date(entry.timestamp);
      switch (entry.entry_type) {
        case 'clock_in':
          clockInTime = t;
          break;
        case 'break_start':
          breakStartTime = t;
          break;
        case 'break_end':
          if (breakStartTime) {
            totalBreakMs += t.getTime() - breakStartTime.getTime();
            breakStartTime = null;
          }
          break;
        case 'clock_out':
          if (clockInTime) {
            totalMs += t.getTime() - clockInTime.getTime();
            clockInTime = null;
          }
          break;
      }
    }

    // If still clocked in, calculate running time
    if (clockInTime) {
      totalMs += Date.now() - clockInTime.getTime();
    }
    if (breakStartTime) {
      totalBreakMs += Date.now() - breakStartTime.getTime();
    }

    const netMs = Math.max(0, totalMs - totalBreakMs);
    const hours = Math.floor(netMs / 3600000);
    const minutes = Math.floor((netMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'clock_in': return <LogIn className="w-3 h-3" />;
      case 'clock_out': return <LogOut className="w-3 h-3" />;
      case 'break_start': case 'break_end': return <Coffee className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Real-Time Location Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeLocations = locations.filter(l => l.is_active);
  const totalPersonnel = activeLocations.reduce((s, l) => s + l.personnel.length, 0);
  const totalClockedIn = activeLocations.reduce((s, l) => 
    s + l.personnel.filter(p => {
      const st = getPersonStatus(p.entries);
      return st.status === 'active';
    }).length, 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Activity className="w-5 h-5 text-primary" />
              Real-Time Location Monitor
            </CardTitle>
            <CardDescription>
              Live attendance across all work locations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <MapPin className="w-3 h-3 mr-1" />
              {activeLocations.length} Locations
            </Badge>
            <Badge variant="outline" className="border-success/30 text-success">
              <Users className="w-3 h-3 mr-1" />
              {totalClockedIn}/{totalPersonnel} Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeLocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active work locations</p>
          </div>
        ) : (
          activeLocations.map((location) => {
            const locClockedIn = location.personnel.filter(p => getPersonStatus(p.entries).status === 'active').length;
            const locOnBreak = location.personnel.filter(p => getPersonStatus(p.entries).status === 'break').length;
            const locDone = location.personnel.filter(p => getPersonStatus(p.entries).status === 'done').length;

            return (
              <div key={location.id} className="rounded-xl border bg-card overflow-hidden">
                {/* Location Header */}
                <div className="px-4 py-3 bg-muted/50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{location.name}</span>
                    {location.address && (
                      <span className="text-xs text-muted-foreground">• {location.address}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-[11px] bg-success/10 text-success border-success/20">
                      {locClockedIn} Active
                    </Badge>
                    {locOnBreak > 0 && (
                      <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {locOnBreak} Break
                      </Badge>
                    )}
                    {locDone > 0 && (
                      <Badge variant="outline" className="text-[11px] bg-destructive/10 text-destructive border-destructive/20">
                        {locDone} Done
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[11px]">
                      {location.personnel.length} Total
                    </Badge>
                  </div>
                </div>

                {/* Personnel List */}
                {location.personnel.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No personnel assigned
                  </div>
                ) : (
                  <div className="divide-y">
                    {location.personnel.map((person) => {
                      const status = getPersonStatus(person.entries);
                      const worked = person.entries.length > 0 ? getWorkedHours(person.entries) : null;

                      return (
                        <div key={`${person.role}-${person.id}`} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={person.photo_url || ''} />
                            <AvatarFallback className={`text-xs ${person.role === 'sao' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {person.first_name[0]}{person.last_name[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm truncate">
                                {person.first_name} {person.last_name}
                              </span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${person.role === 'sao' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                {person.role === 'sao' ? (
                                  <><Shield className="w-2.5 h-2.5 mr-0.5" />SAO</>
                                ) : 'Worker'}
                              </Badge>
                            </div>
                            {/* Time entries row */}
                            {person.entries.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {person.entries.map((entry, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 ${getEntryColor(entry.entry_type)}`}
                                  >
                                    {getEntryIcon(entry.entry_type)}
                                    <span className="ml-0.5">{getEntryLabel(entry.entry_type)} {formatPHTime(new Date(entry.timestamp))}</span>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground mt-0.5">No entries today</p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <Badge variant="outline" className={`text-[11px] ${status.color}`}>
                              {status.label}
                            </Badge>
                            {worked && (
                              <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-end gap-0.5">
                                <Clock className="w-3 h-3" />
                                {worked}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
