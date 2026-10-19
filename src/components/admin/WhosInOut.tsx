import { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatPHTime, getPhilippineToday } from '@/lib/philippineTime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Status = 'in' | 'break' | 'out';
interface Member {
  id: string;
  name: string;
  photo: string | null;
  type: string;
  status: Status;
  timestamp: string;
}
const statuses: Status[] = ['in', 'break', 'out'];
const statusColors = { in: 'bg-success', break: 'bg-warning', out: 'bg-muted-foreground' };

// This panel reports only today's events; other attendance/shift logic is unchanged.
async function latestEvents(table: 'time_entries' | 'worker_time_entries', ids: Set<string>, organizationId: string, day: string) {
  const start = new Date(`${day}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const latest = new Map<string, { entry_type: string; timestamp: string }>();
  for (let offset = 0; latest.size < ids.size; offset += 1000) {
    const columns = table === 'time_entries' ? 'employee_id, entry_type, timestamp' : 'worker_id, entry_type, timestamp';
    const { data, error } = await supabase.from(table).select(columns)
      .eq('organization_id', organizationId).gte('timestamp', start.toISOString()).lt('timestamp', end.toISOString())
      .order('timestamp', { ascending: false }).order('id', { ascending: false })
      .range(offset, offset + 999);
    if (error) throw error;
    for (const entry of (data ?? []) as unknown as { employee_id?: string; worker_id?: string; entry_type: string; timestamp: string }[]) {
      const id = entry.employee_id ?? entry.worker_id;
      if (id && ids.has(id) && !latest.has(id)) latest.set(id, entry);
    }
    if (!data || data.length < 1000) break;
  }
  return latest;
}

export function WhosInOut() {
  const { organizationId } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Status>('in');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [today, setToday] = useState(getPhilippineToday);

  useEffect(() => {
    const rollover = setInterval(() => setToday(getPhilippineToday()), 1000);
    return () => clearInterval(rollover);
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    let disposed = false;
    let running = false;
    let queued = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setMembers([]);
    setLoading(true);
    const fetchMembers = async () => {
      if (running) { queued = true; return; }
      running = true;
      try {
        const [employees, workers, roles] = await Promise.all([
          supabase.from('employees').select('id, user_id, first_name, last_name, photo_url').eq('organization_id', organizationId),
          supabase.from('workers').select('id, first_name, last_name, photo_url').eq('organization_id', organizationId),
          supabase.from('user_roles').select('user_id, role').eq('organization_id', organizationId),
        ]);
        if (employees.error || workers.error || roles.error) throw new Error('Unable to load attendance');
        const roleMap = new Map(roles.data?.map(role => [role.user_id, role.role]));
        const [employeeEvents, workerEvents] = await Promise.all([
          latestEvents('time_entries', new Set(employees.data?.map(person => person.id)), organizationId, today),
          latestEvents('worker_time_entries', new Set(workers.data?.map(person => person.id)), organizationId, today),
        ]);
        const result: Member[] = [];
        const addMember = (person: { id: string; first_name: string; last_name: string; photo_url: string | null }, type: string, events: Map<string, { entry_type: string; timestamp: string }>) => {
          const event = events.get(person.id);
          // No attendance record is not evidence of a clock-out.
          if (!event) return;
          const status = event.entry_type === 'clock_out' ? 'out' : event.entry_type === 'break_start' ? 'break' : 'in';
          result.push({ id: `${type}-${person.id}`, name: `${person.first_name} ${person.last_name}`, photo: person.photo_url, type, status, timestamp: event.timestamp });
        };
        employees.data?.forEach(person => addMember(person, person.user_id && roleMap.get(person.user_id) === 'site_admin_officer' ? 'Site Officer' : 'Employee', employeeEvents));
        workers.data?.forEach(person => addMember(person, 'Worker', workerEvents));
        result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        if (!disposed) { setMembers(result); setError(false); }
      } catch {
        if (!disposed) setError(true);
      } finally {
        running = false;
        if (!disposed) {
          setLoading(false);
          if (queued) { queued = false; void fetchMembers(); }
        }
      }
    };
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (!disposed) void fetchMembers(); }, 250);
    };
    void fetchMembers();
    const channel = supabase.channel(`whos-in-out-${organizationId}`);
    for (const table of ['time_entries', 'worker_time_entries', 'employees', 'workers', 'user_roles']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `organization_id=eq.${organizationId}` }, scheduleRefresh);
    }
    channel.subscribe();
    const poll = setInterval(() => { if (!document.hidden) scheduleRefresh(); }, 60000);
    const onVisible = () => { if (!document.hidden) scheduleRefresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [organizationId, refresh, today]);

  const visible = members.filter(member => member.status === selected && `${member.name} ${member.type}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card className="overflow-hidden rounded-lg h-full" aria-label="Live attendance status">
      <CardHeader className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Who's in/out</CardTitle>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-warning' : 'bg-success'}`} />{error ? 'Unavailable' : 'Live'}</span>
        </div>
        <p className="text-xs text-muted-foreground">Today · {new Date(`${today}T00:00:00+08:00`).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={selected} onValueChange={value => setSelected(value as Status)}>
          <TabsList className="grid grid-cols-3 h-auto w-full rounded-none bg-transparent p-0 border-b">
            {statuses.map(status => (
              <TabsTrigger key={status} value={status} className="flex-col gap-0.5 rounded-none border-b-2 border-transparent py-2.5 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-primary/5">
                <span className="text-lg font-bold leading-none">{loading ? '—' : members.filter(member => member.status === status).length}</span>
                <span className="text-[10px] uppercase font-semibold">{status}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative mx-4 my-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search members" placeholder="Search members" value={search} onChange={event => setSearch(event.target.value)} className="pl-9 h-9 bg-muted/30" />
        </div>
        {error && <div className="px-4 pb-3 text-xs text-destructive" role="alert">Attendance could not be refreshed.<Button variant="ghost" size="sm" onClick={() => setRefresh(value => value + 1)}><RefreshCw className="mr-1 h-3 w-3" />Retry</Button></div>}
        <div className="max-h-[420px] min-h-[180px] overflow-y-auto px-4 pb-2" role="tabpanel" aria-label={`${selected} members`} aria-live="polite">
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p> : visible.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{search ? 'No matching members' : 'No members'}</p> : visible.map(member => (
            <div key={member.id} className="flex items-center gap-3 border-b last:border-0 py-3">
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9"><AvatarImage src={member.photo ?? undefined} alt={member.name} /><AvatarFallback className="bg-muted text-muted-foreground text-xs">{member.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</AvatarFallback></Avatar>
                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card ${statusColors[member.status]}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={member.name}>{member.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatPHTime(member.timestamp)}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{member.type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}