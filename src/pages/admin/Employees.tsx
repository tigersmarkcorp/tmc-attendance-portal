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
  Clock,
  Users,
  UserPlus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Pause,
} from 'lucide-react';
import { format } from 'date-fns';
import { AddEmployeeForm } from '@/components/admin/AddEmployeeForm';
import { EmployeeDetailSheet } from '@/components/admin/EmployeeDetailSheet';

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  hourly_rate: number;
  photo_url: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  hire_date: string;
  date_of_birth: string | null;
  sex: string | null;
  civil_status: string | null;
  citizenship: string | null;
  religion: string | null;
  height: string | null;
  weight: string | null;
  city_address: string | null;
  provincial_address: string | null;
  telephone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_address: string | null;
  father_name: string | null;
  mother_name: string | null;
  parents_address: string | null;
  parents_occupation: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  elementary_school: string | null;
  elementary_year: string | null;
  highschool_school: string | null;
  highschool_year: string | null;
  college_school: string | null;
  college_year: string | null;
  degree_received: string | null;
  special_skills: string | null;
  languages: string | null;
  position_desired: string | null;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setEmployees(data as Employee[]);
    }
    setLoading(false);
  };

  const handleEmployeeCreated = () => {
    setShowAddDialog(false);
    fetchEmployees();
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailSheet(true);
  };

  const handleStatusChange = async (employeeId: string, newStatus: 'active' | 'inactive' | 'on_leave') => {
    const { error } = await supabase
      .from('employees')
      .update({ status: newStatus })
      .eq('id', employeeId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status Updated',
        description: `Employee status changed to ${newStatus.replace('_', ' ')}.`,
      });
      fetchEmployees();
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    inactive: employees.filter((e) => e.status === 'inactive').length,
    onLeave: employees.filter((e) => e.status === 'on_leave').length,
  };

  const statusConfig = {
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
      icon: Pause, 
      color: 'bg-warning/10 text-warning border-warning/20', 
      label: 'On Leave' 
    },
  };

  return (
    <DashboardLayout title="Employee Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Employees</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
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
          <Card className="border-0 shadow-soft bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Leave</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.onLeave}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
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
                placeholder="Search by name, email, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? 'All Status' : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
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
                <DropdownMenuItem onClick={() => setStatusFilter('on_leave')}>
                  <Pause className="w-4 h-4 mr-2 text-warning" />
                  On Leave
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 gradient-primary shadow-lg hover:shadow-xl transition-shadow">
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    Add New Employee
                  </DialogTitle>
                  <DialogDescription>
                    Complete the employee application form. Login credentials will be created automatically.
                  </DialogDescription>
                </DialogHeader>
                <AddEmployeeForm onSuccess={handleEmployeeCreated} onCancel={() => setShowAddDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Employees Table */}
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {searchQuery || statusFilter !== 'all' ? 'No employees found' : 'No employees yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first employee'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setShowAddDialog(true)} className="gradient-primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Employee
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Employee</TableHead>
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="font-semibold">Position</TableHead>
                      <TableHead className="font-semibold">Rate</TableHead>
                      <TableHead className="font-semibold">Hire Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => {
                      const StatusIcon = statusConfig[emp.status]?.icon || CheckCircle;
                      return (
                        <TableRow 
                          key={emp.id} 
                          className="group cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => handleViewEmployee(emp)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-background shadow-sm">
                                <AvatarImage src={emp.photo_url || ''} />
                                <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-medium">
                                  {emp.first_name[0]}
                                  {emp.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 text-xs rounded-md bg-muted font-mono">
                              {emp.employee_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{emp.department || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{emp.position || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">₱{emp.hourly_rate.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">/hr</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{format(new Date(emp.hire_date), 'MMM d, yyyy')}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig[emp.status]?.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[emp.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewEmployee(emp)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Full Info
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(emp.id, 'active')}
                                  disabled={emp.status === 'active'}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-success" />
                                  Set Active
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(emp.id, 'inactive')}
                                  disabled={emp.status === 'inactive'}
                                >
                                  <XCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                                  Set Inactive
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(emp.id, 'on_leave')}
                                  disabled={emp.status === 'on_leave'}
                                >
                                  <Pause className="w-4 h-4 mr-2 text-warning" />
                                  Set On Leave
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

        {/* Results count */}
        {!loading && filteredEmployees.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        )}
      </div>

      {/* Employee Detail Sheet */}
      <EmployeeDetailSheet
        employee={selectedEmployee}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onEmployeeUpdated={fetchEmployees}
      />
    </DashboardLayout>
  );
}
