import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2, Eye, MoreHorizontal, UserPlus, Filter, HardHat, UserCheck, UserX, CheckCircle, XCircle, Users } from 'lucide-react';
import { AddWorkerForm } from '@/components/admin/AddWorkerForm';
import { WorkerDetailSheet } from '@/components/admin/WorkerDetailSheet';

interface Worker {
  id: string;
  worker_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  photo_url: string | null;
  hourly_rate: number | null;
  status: string;
  assigned_sao_id: string | null;
  assigned_location_id: string | null;
  created_at: string;
}

export default function EncoderWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailWorker, setDetailWorker] = useState<Worker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkers();
    const channel = supabase
      .channel('encoder-workers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => fetchWorkers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchWorkers = async () => {
    const { data } = await supabase.from('workers').select('*').order('created_at', { ascending: false });
    if (data) setWorkers(data);
    setLoading(false);
  };

  const handleWorkerCreated = () => {
    setShowAddDialog(false);
    fetchWorkers();
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.worker_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workers.length,
    active: workers.filter((w) => w.status === 'active').length,
    inactive: workers.filter((w) => w.status === 'inactive').length,
  };

  return (
    <DashboardLayout title="Workers Management" portalType="encoder">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-amber-500/5 to-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Workers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10"><HardHat className="w-5 h-5 text-amber-500" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10"><UserCheck className="w-5 h-5 text-success" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-muted to-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inactive</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.inactive}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted-foreground/10"><UserX className="w-5 h-5 text-muted-foreground" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-soft">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, ID, or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-background border-border" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? 'All Status' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}><Users className="w-4 h-4 mr-2" /> All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}><CheckCircle className="w-4 h-4 mr-2 text-success" /> Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}><XCircle className="w-4 h-4 mr-2 text-muted-foreground" /> Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg">
                <UserPlus className="w-4 h-4" /> Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><HardHat className="w-5 h-5 text-amber-500" /> Add New Worker</DialogTitle>
                <DialogDescription>Enter worker information.</DialogDescription>
              </DialogHeader>
              <AddWorkerForm onSuccess={handleWorkerCreated} onCancel={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Worker List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredWorkers.length === 0 ? (
          <Card className="border border-border"><CardContent className="p-12 text-center"><HardHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No workers found.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredWorkers.map((worker) => (
              <Card key={worker.id} className="group cursor-pointer border border-border hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                onClick={() => { setDetailWorker(worker); setDetailSheetOpen(true); }}>
                <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                  {worker.photo_url ? (
                    <img src={worker.photo_url} alt={`${worker.first_name} ${worker.last_name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-600/20">
                      <span className="text-2xl font-black text-amber-500/40 select-none">{worker.first_name[0]}{worker.last_name[0]}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${worker.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                  <div className="absolute bottom-2 inset-x-2 text-center">
                    <p className="text-white font-semibold text-xs truncate">{worker.first_name} {worker.last_name}</p>
                    <p className="text-white/70 text-[10px]">{worker.worker_id}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {detailWorker && (
        <WorkerDetailSheet
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          worker={detailWorker}
          onWorkerUpdated={fetchWorkers}
          portalType="encoder"
        />
      )}
    </DashboardLayout>
  );
}
