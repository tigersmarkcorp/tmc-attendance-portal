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
import { Search, Loader2, UserPlus, Filter, Users, UserCheck, UserX, Clock, CheckCircle, XCircle, Pause } from 'lucide-react';
import { AddEmployeeForm } from '@/components/admin/AddEmployeeForm';
import { EmployeeDetailSheet } from '@/components/admin/EmployeeDetailSheet';

interface Employee {
  id: string;
  user_id: string | null;
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
  sss_number: string | null;
  tin_id: string | null;
  pagibig_id: string | null;
  philhealth_id: string | null;
  nbi_id: string | null;
}

export default function EncoderEmployees() {
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
    const channel = supabase
      .channel('encoder-employees-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchEmployees())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (data) setEmployees(data as Employee[]);
    setLoading(false);
  };

  const handleEmployeeCreated = () => {
    setShowAddDialog(false);
    fetchEmployees();
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    inactive: employees.filter((e) => e.status === 'inactive').length,
    onLeave: employees.filter((e) => e.status === 'on_leave').length,
  };

  return (
    <DashboardLayout title="Employee Management" portalType="encoder">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Employees</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
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
          <Card className="border-0 shadow-soft bg-gradient-to-br from-warning/5 to-warning/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Leave</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.onLeave}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10"><Clock className="w-5 h-5 text-warning" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-soft">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-background border-border" />
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
                <DropdownMenuItem onClick={() => setStatusFilter('on_leave')}><Pause className="w-4 h-4 mr-2 text-warning" /> On Leave</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary shadow-lg hover:shadow-xl transition-shadow">
                <UserPlus className="w-4 h-4" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Add New Employee</DialogTitle>
                <DialogDescription>Complete the employee application form. Login credentials will be created automatically.</DialogDescription>
              </DialogHeader>
              <AddEmployeeForm onSuccess={handleEmployeeCreated} onCancel={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="border border-border"><CardContent className="p-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No employees found.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredEmployees.map((emp) => {
              const statusDot = emp.status === 'active' ? 'bg-success' : emp.status === 'on_leave' ? 'bg-warning' : 'bg-muted-foreground';
              return (
                <Card key={emp.id} className="group cursor-pointer border border-border hover:border-primary/40 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  onClick={() => { setSelectedEmployee(emp); setShowDetailSheet(true); }}>
                  <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                    {emp.photo_url ? (
                      <img src={emp.photo_url} alt={`${emp.first_name} ${emp.last_name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20">
                        <span className="text-2xl font-black text-primary/40 select-none">{emp.first_name[0]}{emp.last_name[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${statusDot}`} />
                    <div className="absolute bottom-2 inset-x-2 text-center">
                      <p className="text-white font-semibold text-xs truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-white/70 text-[10px]">{emp.position || emp.employee_id}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <EmployeeDetailSheet
          open={showDetailSheet}
          onOpenChange={setShowDetailSheet}
          employee={selectedEmployee}
          onEmployeeUpdated={fetchEmployees}
          portalType="encoder"
        />
      )}
    </DashboardLayout>
  );
}
