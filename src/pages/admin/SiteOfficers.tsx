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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreHorizontal, 
  UserCheck, 
  UserX,
  ShieldCheck,
  UserPlus,
  Filter,
  CheckCircle,
  XCircle,
  DollarSign,
  MapPin,
  Eye,
  Trash2,
  Clock,
  Camera,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AddSAOForm } from '@/components/admin/AddSAOForm';
import { SAOAttendanceSheet } from '@/components/admin/SAOAttendanceSheet';
import { AssignMultipleLocationsDialog } from '@/components/admin/AssignMultipleLocationsDialog';
import { RealTimeClockStatus } from '@/components/admin/RealTimeClockStatus';
import { MultiLocationBadges } from '@/components/admin/MultiLocationBadges';

interface SAOEmployee {
  id: string;
  user_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  photo_url: string | null;
  status: string;
  hourly_rate: number;
  hire_date: string;
  created_at: string;
  assigned_location_id?: string | null;
}

interface WorkLocation {
  id: string;
  name: string;
}

interface WorkerCount {
  [saoId: string]: number;
}

export default function SiteOfficers() {
  const [saoList, setSaoList] = useState<SAOEmployee[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [workerCounts, setWorkerCounts] = useState<WorkerCount>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saoToDelete, setSaoToDelete] = useState<SAOEmployee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [attendanceSheetOpen, setAttendanceSheetOpen] = useState(false);
  const [selectedSAO, setSelectedSAO] = useState<SAOEmployee | null>(null);
  const [assignLocationOpen, setAssignLocationOpen] = useState(false);
  const [saoToAssignLocation, setSaoToAssignLocation] = useState<SAOEmployee | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSAOList();
    fetchWorkLocations();
    fetchWorkerCounts();
  }, []);

  const fetchSAOList = async () => {
    // Get all users with SAO role
    const { data: saoRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'site_admin_officer');

    if (saoRoles && saoRoles.length > 0) {
      const userIds = saoRoles.map(r => r.user_id);
      const { data: saoEmployees } = await supabase
        .from('employees')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (saoEmployees) {
        setSaoList(saoEmployees);
      }
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

  const fetchWorkerCounts = async () => {
    const { data } = await supabase
      .from('workers')
      .select('assigned_sao_id');
    
    if (data) {
      const counts: WorkerCount = {};
      data.forEach(worker => {
        if (worker.assigned_sao_id) {
          counts[worker.assigned_sao_id] = (counts[worker.assigned_sao_id] || 0) + 1;
        }
      });
      setWorkerCounts(counts);
    }
  };

  const handleSAOCreated = () => {
    setShowAddDialog(false);
    fetchSAOList();
    fetchWorkerCounts();
  };

  const handleStatusChange = async (saoId: string, newStatus: 'active' | 'inactive' | 'on_leave') => {
    const { error } = await supabase
      .from('employees')
      .update({ status: newStatus })
      .eq('id', saoId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Updated',
        description: `SAO status changed to ${newStatus}.`,
      });
      fetchSAOList();
    }
  };

  const handleDeleteSAO = async () => {
    if (!saoToDelete) return;
    
    setDeleting(true);
    try {
      // Delete user role
      if (saoToDelete.user_id) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', saoToDelete.user_id);
      }

      // Delete employee record
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', saoToDelete.id);

      if (error) throw error;

      toast({
        title: 'SAO Deleted',
        description: 'Site Administration Officer has been removed.',
      });
      
      fetchSAOList();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete SAO.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setSaoToDelete(null);
    }
  };

  const handleViewAttendance = (sao: SAOEmployee) => {
    setSelectedSAO(sao);
    setAttendanceSheetOpen(true);
  };

  const handleAssignLocation = (sao: SAOEmployee) => {
    setSaoToAssignLocation(sao);
    setAssignLocationOpen(true);
  };

  const getLocationName = (locationId: string | null | undefined) => {
    if (!locationId) return null;
    const location = workLocations.find(l => l.id === locationId);
    return location?.name || null;
  };

  const filteredSAOs = saoList.filter((sao) => {
    const matchesSearch =
      sao.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sao.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sao.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sao.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sao.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: saoList.length,
    active: saoList.filter((s) => s.status === 'active').length,
    inactive: saoList.filter((s) => s.status === 'inactive').length,
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
    on_leave: { 
      icon: Clock, 
      color: 'bg-warning/10 text-warning border-warning/20', 
      label: 'On Leave' 
    },
  };

  return (
    <DashboardLayout title="Site Administration Officers">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-violet-500/5 to-violet-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total SAOs</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <ShieldCheck className="w-5 h-5 text-violet-500" />
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
              <Button className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-shadow">
                <UserPlus className="w-4 h-4" />
                Add Site Officer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-500" />
                  Add Site Administration Officer
                </DialogTitle>
                <DialogDescription>
                  Create a new SAO account with portal access for managing workers.
                </DialogDescription>
              </DialogHeader>
              <AddSAOForm onSuccess={handleSAOCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {/* SAO Table */}
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-sm text-muted-foreground">Loading site officers...</p>
              </div>
            ) : filteredSAOs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {searchQuery || statusFilter !== 'all' ? 'No SAOs found' : 'No site officers yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first site administration officer'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-violet-500 to-indigo-500">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First SAO
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Site Officer</TableHead>
                      <TableHead className="font-semibold">Employee ID</TableHead>
                      <TableHead className="font-semibold">Workers</TableHead>
                      <TableHead className="font-semibold">Assigned Locations</TableHead>
                      <TableHead className="font-semibold">Today's Time</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSAOs.map((sao) => {
                      const StatusIcon = statusConfig[sao.status]?.icon || CheckCircle;
                      return (
                        <TableRow key={sao.id} className="group hover:bg-violet-500/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                                <AvatarImage src={sao.photo_url || ''} />
                                <AvatarFallback className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-medium">
                                  {sao.first_name[0]}
                                  {sao.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-violet-600 transition-colors">
                                  {sao.first_name} {sao.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{sao.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 text-xs rounded-md bg-muted font-mono">
                              {sao.employee_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-primary/10">
                                <Users className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="font-medium">{workerCounts[sao.id] || 0}</span>
                              <span className="text-xs text-muted-foreground">workers</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <MultiLocationBadges entityType="employee" entityId={sao.id} />
                          </TableCell>
                          <TableCell>
                            <RealTimeClockStatus entityType="employee" entityId={sao.id} />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig[sao.status]?.color || ''}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[sao.status]?.label || sao.status}
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
                                <DropdownMenuItem onClick={() => handleAssignLocation(sao)}>
                                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                                  Assign Location
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewAttendance(sao)}>
                                  <Camera className="w-4 h-4 mr-2 text-blue-500" />
                                  View Attendance & Selfies
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/timesheets?employee=${sao.id}`)}>
                                  <Clock className="w-4 h-4 mr-2 text-purple-500" />
                                  View Payroll
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/payroll?generate=true&employee=${sao.id}`)}>
                                  <DollarSign className="w-4 h-4 mr-2 text-success" />
                                  Generate Salary
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange(sao.id, 'active')}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                  Set Active
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(sao.id, 'inactive')}>
                                  <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                                  Set Inactive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSaoToDelete(sao);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete SAO
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Site Administration Officer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {saoToDelete?.first_name} {saoToDelete?.last_name}'s account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSAO}
                disabled={deleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* SAO Attendance Sheet */}
        {selectedSAO && (
          <SAOAttendanceSheet
            open={attendanceSheetOpen}
            onOpenChange={setAttendanceSheetOpen}
            sao={selectedSAO}
          />
        )}

        {/* Assign Multiple Locations Dialog */}
        {saoToAssignLocation && (
          <AssignMultipleLocationsDialog
            open={assignLocationOpen}
            onOpenChange={setAssignLocationOpen}
            entityId={saoToAssignLocation.id}
            entityName={`${saoToAssignLocation.first_name} ${saoToAssignLocation.last_name}`}
            entityType="employee"
            onSuccess={fetchSAOList}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
