import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, HardHat, Clock, DollarSign, Calendar } from 'lucide-react';
import { getPhilippineDateString } from '@/lib/philippineTime';
import { formatCurrency } from '@/lib/currency';
import { WorkerSelfClockWidget } from '@/components/worker/WorkerSelfClockWidget';
import { WorkerWorkLocationMap } from '@/components/worker/WorkerWorkLocationMap';
import { MyTimeBreakdown } from '@/components/shared/MyTimeBreakdown';
import { WorkerAssignedSAOs } from '@/components/worker/WorkerAssignedSAOs';

interface Worker {
  id: string;
  worker_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hourly_rate: number | null;
  photo_url: string | null;
  status: string;
  date_hired: string | null;
}

export default function WorkerDashboard() {
  const { user, loading } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [stats, setStats] = useState({ hoursMonth: 0, earningsMonth: 0, entriesCount: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: w } = await supabase
        .from('workers').select('*').eq('user_id', user.id).maybeSingle();
      if (!w) { setDataLoading(false); return; }
      setWorker(w as any);

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

      const [tsRes, entriesRes] = await Promise.all([
        supabase.from('worker_timesheets')
          .select('total_work_minutes, total_pay')
          .eq('worker_id', w.id).gte('date', monthStart).lte('date', monthEnd),
        supabase.from('worker_time_entries')
          .select('id', { count: 'exact', head: true }).eq('worker_id', w.id),
      ]);
      const mins = (tsRes.data || []).reduce((s, t) => s + (t.total_work_minutes || 0), 0);
      const pay = (tsRes.data || []).reduce((s, t) => s + (t.total_pay || 0), 0);
      setStats({ hoursMonth: Math.round(mins / 60 * 10) / 10, earningsMonth: pay, entriesCount: entriesRes.count || 0 });
      setDataLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading || dataLoading) {
    return (
      <DashboardLayout title="Dashboard" portalType="worker">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!worker) {
    return (
      <DashboardLayout title="Dashboard" portalType="worker">
        <Card className="border-warning">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
              <HardHat className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Worker Profile Not Linked</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your worker profile is not linked to this account yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const initials = `${worker.first_name[0] || ''}${worker.last_name[0] || ''}`.toUpperCase();

  return (
    <DashboardLayout title="Dashboard" portalType="worker">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent p-6 border border-sky-500/10">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-sky-500/30">
              <AvatarImage src={worker.photo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs font-semibold text-sky-600 uppercase tracking-widest mb-1">Worker Portal</p>
              <h2 className="text-2xl font-bold tracking-tight">Welcome, {worker.first_name} {worker.last_name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{getPhilippineDateString()}</p>
            </div>
            <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-700">
              {worker.status}
            </Badge>
          </div>
        </div>

        <WorkerSelfClockWidget workerId={worker.id} workerName={`${worker.first_name} ${worker.last_name}`} />

        <WorkerWorkLocationMap workerId={worker.id} />

        <WorkerAssignedSAOs workerId={worker.id} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10"><Clock className="w-5 h-5 text-sky-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Hours This Month</p>
                <p className="text-2xl font-bold">{stats.hoursMonth}h</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10"><DollarSign className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Earnings This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.earningsMonth)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10"><Calendar className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Clock Events</p>
                <p className="text-2xl font-bold">{stats.entriesCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <MyTimeBreakdown entityType="worker" entityId={worker.id} />

        <Card>
          <CardHeader>
            <CardTitle>My Information</CardTitle>
            <CardDescription>Details on file</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="Worker ID" value={worker.worker_id} />
            <Info label="Email" value={worker.email} />
            <Info label="Phone" value={worker.phone} />
            <Info label="Position" value={worker.position} />
            <Info label="Department" value={worker.department} />
            <Info label="Hourly Rate" value={worker.hourly_rate != null ? formatCurrency(worker.hourly_rate) + '/hr' : null} />
            <Info label="Date Hired" value={worker.date_hired} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}
