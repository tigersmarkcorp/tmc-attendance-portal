import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Loader2, 
  Eye, 
  MoreHorizontal, 
  UserCheck, 
  UserX,
  Users,
  UserPlus,
  Filter,
  HardHat,
  UserCog,
  CheckCircle,
  XCircle,
  DollarSign,
  Camera,
  Trash2,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AddWorkerForm } from '@/components/admin/AddWorkerForm';
import { WorkerAttendanceSheet } from '@/components/admin/WorkerAttendanceSheet';
import { AssignMultipleLocationsDialog } from '@/components/admin/AssignMultipleLocationsDialog';
import { RealTimeClockStatus } from '@/components/admin/RealTimeClockStatus';
import { MultiLocationBadges } from '@/components/admin/MultiLocationBadges';

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
  status: string;
  assigned_sao_id: string | null;
  assigned_location_id: string | null;
  created_at: string;
}

interface WorkLocation {
  id: string;
  name: string;
}

interface SAOEmployee {
  id: string;
  first_name: string;
  last_name: string;
}

export default function Workers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [saoList, setSaoList] = useState<SAOEmployee[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [attendanceSheetOpen, setAttendanceSheetOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [assignLocationOpen, setAssignLocationOpen] = useState(false);
  const [workerToAssignLocation, setWorkerToAssignLocation] = useState<Worker | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleViewAttendance = (worker: Worker) => {
    setSelectedWorker(worker);
    setAttendanceSheetOpen(true);
  };

  const handleDeleteWorker = async (workerId: string) => {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', workerId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete worker.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Worker Deleted',
        description: 'Worker has been removed.',
      });
      fetchWorkers();
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchSAOList();
    fetchWorkLocations();
  }, []);

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setWorkers(data);
    }
    setLoading(false);
  };

  const fetchWorkLocations = async () => {
    const { data } = await supabase
      .from('work_locations')
      .select('id, name')
      .eq('is_active', true);
    
    if (data) {
      setWorkLocations(data);
    }
  };

  const fetchSAOList = async () => {
    // Get employees who are SAOs
    const { data: saoRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'site_admin_officer');

    if (saoRoles && saoRoles.length > 0) {
      const userIds = saoRoles.map(r => r.user_id);
      const { data: saoEmployees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, user_id')
        .in('user_id', userIds);

      if (saoEmployees) {
        setSaoList(saoEmployees);
      }
    }
  };

  const handleWorkerCreated = () => {
    setShowAddDialog(false);
    fetchWorkers();
  };

  const handleAssignSAO = async (workerId: string, saoId: string | null) => {
    const { error } = await supabase
      .from('workers')
      .update({ assigned_sao_id: saoId })
      .eq('id', workerId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign SAO.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: saoId ? 'Worker assigned to SAO.' : 'Worker unassigned.',
      });
      fetchWorkers();
    }
  };

  const handleStatusChange = async (workerId: string, newStatus: string) => {
    const { error } = await supabase
      .from('workers')
      .update({ status: newStatus })
      .eq('id', workerId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Updated',
        description: `Worker status changed to ${newStatus}.`,
      });
      fetchWorkers();
    }
  };

  const getSAOName = (saoId: string | null) => {
    if (!saoId) return 'Unassigned';
    const sao = saoList.find(s => s.id === saoId);
    return sao ? `${sao.first_name} ${sao.last_name}` : 'Unknown';
  };

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return null;
    const location = workLocations.find(l => l.id === locationId);
    return location?.name || null;
  };

  const handleAssignLocation = (worker: Worker) => {
    setWorkerToAssignLocation(worker);
    setAssignLocationOpen(true);
  };

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.worker_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (worker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'all' || worker.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workers.length,
    active: workers.filter((w) => w.status === 'active').length,
    inactive: workers.filter((w) => w.status === 'inactive').length,
    assigned: workers.filter((w) => w.assigned_sao_id).length,
  };

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    active: { 
      icon: CheckCircle, 
      color: 'bg-success/10 text-success border-success/20', 
      label: 'Active' 
    },
    inactive: { 
      icon: XCircle, 
      color: 'bg-muted text-muted-foreground border-border', 
      label: 'Inactive' 
    },
  };

  return (
    <DashboardLayout title="Workers Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-amber-500/5 to-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Workers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <HardHat className="w-5 h-5 text-amber-500" />
                </div>
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
                <div className="p-3 rounded-xl bg-success/10">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
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
                <div className="p-3 rounded-xl bg-muted-foreground/10">
                  <UserX className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-violet-500/5 to-violet-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned to SAO</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.assigned}</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <UserCog className="w-5 h-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-soft">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? 'All Status' : statusConfig[statusFilter]?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  <Users className="w-4 h-4 mr-2" />
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-success" />
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                  <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-shadow">
                <UserPlus className="w-4 h-4" />
                Add Worker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-500" />
                  Add New Worker
                </DialogTitle>
                <DialogDescription>
                  Enter worker information. You can assign them to an SAO later.
                </DialogDescription>
              </DialogHeader>
              <AddWorkerForm onSuccess={handleWorkerCreated} onCancel={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Workers Table */}
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">Loading workers...</p>
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <HardHat className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {searchQuery || statusFilter !== 'all' ? 'No workers found' : 'No workers yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first worker'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-amber-500 to-orange-500">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Worker
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Worker</TableHead>
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Assigned Locations</TableHead>
                      <TableHead className="font-semibold">Today's Time</TableHead>
                      <TableHead className="font-semibold">Assigned SAO</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((worker) => {
                      const StatusIcon = statusConfig[worker.status]?.icon || CheckCircle;
                      return (
                        <TableRow key={worker.id} className="group hover:bg-amber-500/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                                <AvatarImage src={worker.photo_url || ''} />
                                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium">
                                  {worker.first_name[0]}
                                  {worker.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-amber-600 transition-colors">
                                  {worker.first_name} {worker.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{worker.email || 'No email'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 text-xs rounded-md bg-muted font-mono">
                              {worker.worker_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <MultiLocationBadges entityType="worker" entityId={worker.id} />
                          </TableCell>
                          <TableCell>
                            <RealTimeClockStatus entityType="worker" entityId={worker.id} />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={worker.assigned_sao_id || 'unassigned'}
                              onValueChange={(value) => handleAssignSAO(worker.id, value === 'unassigned' ? null : value)}
                            >
                              <SelectTrigger className="w-[180px] h-8 text-sm">
                                <SelectValue placeholder="Select SAO" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {saoList.map((sao) => (
                                  <SelectItem key={sao.id} value={sao.id}>
                                    {sao.first_name} {sao.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig[worker.status]?.color || ''}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[worker.status]?.label || worker.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAssignLocation(worker)}>
                                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                                  Assign Location
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewAttendance(worker)}>
                                  <Camera className="w-4 h-4 mr-2 text-blue-500" />
                                  View Attendance & Selfies
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/workers/${worker.id}/payroll`)}>
                                  <DollarSign className="w-4 h-4 mr-2 text-success" />
                                  View Payroll
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange(worker.id, 'active')}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                  Set Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(worker.id, 'inactive')}>
                                  <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                                  Set Inactive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteWorker(worker.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Worker
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        {/* Worker Attendance Sheet */}
        {selectedWorker && (
          <WorkerAttendanceSheet
            open={attendanceSheetOpen}
            onOpenChange={setAttendanceSheetOpen}
            worker={selectedWorker}
          />
        )}

        {/* Assign Multiple Locations Dialog */}
        {workerToAssignLocation && (
          <AssignMultipleLocationsDialog
            open={assignLocationOpen}
            onOpenChange={setAssignLocationOpen}
            entityId={workerToAssignLocation.id}
            entityName={`${workerToAssignLocation.first_name} ${workerToAssignLocation.last_name}`}
            entityType="worker"
            onSuccess={fetchWorkers}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
