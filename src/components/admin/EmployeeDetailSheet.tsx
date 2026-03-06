import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  GraduationCap,
  Users,
  Shield,
  Save,
  Loader2,
  Camera,
  Edit3,
  X,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

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

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
  selfie_url: string | null;
}

interface EmployeeDetailSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeUpdated: () => void;
}

export function EmployeeDetailSheet({
  employee,
  open,
  onOpenChange,
  onEmployeeUpdated,
}: EmployeeDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selfies, setSelfies] = useState<TimeEntry[]>([]);
  const [loadingSelfies, setLoadingSelfies] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      fetchSelfies(employee.id);
    }
  }, [employee]);

  const fetchSelfies = async (employeeId: string) => {
    setLoadingSelfies(true);
    const { data } = await supabase
      .from('time_entries')
      .select('id, entry_type, timestamp, selfie_url')
      .eq('employee_id', employeeId)
      .not('selfie_url', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(12);

    if (data) {
      setSelfies(data);
    }
    setLoadingSelfies(false);
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);

    const { error } = await supabase
      .from('employees')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        hourly_rate: formData.hourly_rate,
        status: formData.status,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        civil_status: formData.civil_status,
        citizenship: formData.citizenship,
        religion: formData.religion,
        height: formData.height,
        weight: formData.weight,
        city_address: formData.city_address,
        provincial_address: formData.provincial_address,
        telephone: formData.telephone,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_address: formData.emergency_contact_address,
        father_name: formData.father_name,
        mother_name: formData.mother_name,
        parents_address: formData.parents_address,
        parents_occupation: formData.parents_occupation,
        spouse_name: formData.spouse_name,
        spouse_occupation: formData.spouse_occupation,
        elementary_school: formData.elementary_school,
        elementary_year: formData.elementary_year,
        highschool_school: formData.highschool_school,
        highschool_year: formData.highschool_year,
        college_school: formData.college_school,
        college_year: formData.college_year,
        degree_received: formData.degree_received,
        special_skills: formData.special_skills,
        languages: formData.languages,
        position_desired: formData.position_desired,
      })
      .eq('id', employee.id);

    setSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update employee. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Employee information updated successfully.',
      });
      setIsEditing(false);
      onEmployeeUpdated();
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'on_leave') => {
    if (!employee) return;
    
    const { error } = await supabase
      .from('employees')
      .update({ status: newStatus })
      .eq('id', employee.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } else {
      setFormData({ ...formData, status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Employee is now ${newStatus.replace('_', ' ')}.`,
      });
      onEmployeeUpdated();
    }
  };

  const statusConfig = {
    active: { icon: CheckCircle, color: 'bg-success text-success-foreground', label: 'Active' },
    inactive: { icon: XCircle, color: 'bg-muted text-muted-foreground', label: 'Inactive' },
    on_leave: { icon: Clock, color: 'bg-warning text-warning-foreground', label: 'On Leave' },
  };

  const entryTypeLabels: Record<string, string> = {
    clock_in: 'Clock In',
    clock_out: 'Clock Out',
    break_start: 'Break Start',
    break_end: 'Break End',
  };

  if (!employee) return null;

  const currentStatus = formData.status || employee.status;
  const StatusIcon = statusConfig[currentStatus]?.icon || CheckCircle;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b border-border">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                <AvatarImage src={employee.photo_url || ''} />
                <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                  {employee.first_name[0]}{employee.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground">
                    {employee.first_name} {employee.last_name}
                  </h2>
                  <Badge className={statusConfig[currentStatus]?.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[currentStatus]?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{employee.position || 'No Position'}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {employee.employee_id}</p>
                
                {/* Quick Status Change */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select value={currentStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </>
                )}
              </Button>
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsEditing(false);
                  setFormData(employee);
                }}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
                <TabsTrigger value="info" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <User className="w-4 h-4 mr-2" />
                  Information
                </TabsTrigger>
                <TabsTrigger value="employment" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Employment
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Education
                </TabsTrigger>
                <TabsTrigger value="selfies" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Camera className="w-4 h-4 mr-2" />
                  Selfies
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="p-6 space-y-6 mt-0">
                {/* Personal Info */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">First Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.first_name || ''}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.first_name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.last_name || ''}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.last_name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {employee.date_of_birth ? format(new Date(employee.date_of_birth), 'MMM d, yyyy') : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sex</Label>
                      {isEditing ? (
                        <Select value={formData.sex || ''} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{employee.sex || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Civil Status</Label>
                      {isEditing ? (
                        <Select value={formData.civil_status || ''} onValueChange={(v) => setFormData({ ...formData, civil_status: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                            <SelectItem value="Separated">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{employee.civil_status || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Citizenship</Label>
                      {isEditing ? (
                        <Input
                          value={formData.citizenship || ''}
                          onChange={(e) => setFormData({ ...formData, citizenship: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.citizenship || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium">{employee.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.phone || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Telephone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.telephone || ''}
                          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.telephone || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">City Address</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.city_address || ''}
                          onChange={(e) => setFormData({ ...formData, city_address: e.target.value })}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.city_address || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Provincial Address</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.provincial_address || ''}
                          onChange={(e) => setFormData({ ...formData, provincial_address: e.target.value })}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.provincial_address || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Contact Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.emergency_contact_name || ''}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.emergency_contact_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Contact Phone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.emergency_contact_phone || ''}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.emergency_contact_phone || '-'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Contact Address</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.emergency_contact_address || ''}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_address: e.target.value })}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.emergency_contact_address || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Family Info */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Family Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Father's Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.father_name || ''}
                          onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.father_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Mother's Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.mother_name || ''}
                          onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.mother_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Spouse Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.spouse_name || ''}
                          onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.spouse_name || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Spouse Occupation</Label>
                      {isEditing ? (
                        <Input
                          value={formData.spouse_occupation || ''}
                          onChange={(e) => setFormData({ ...formData, spouse_occupation: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.spouse_occupation || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="p-6 space-y-6 mt-0">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Employee ID</Label>
                      <p className="text-sm font-medium font-mono">{employee.employee_id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hire Date</Label>
                      <p className="text-sm font-medium">{format(new Date(employee.hire_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      {isEditing ? (
                        <Input
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.department || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Position</Label>
                      {isEditing ? (
                        <Input
                          value={formData.position || ''}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.position || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.hourly_rate || ''}
                          onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">₱{employee.hourly_rate.toFixed(2)}/hr</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Position Desired</Label>
                      {isEditing ? (
                        <Input
                          value={formData.position_desired || ''}
                          onChange={(e) => setFormData({ ...formData, position_desired: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.position_desired || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Skills & Languages
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Special Skills</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.special_skills || ''}
                          onChange={(e) => setFormData({ ...formData, special_skills: e.target.value })}
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.special_skills || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Languages</Label>
                      {isEditing ? (
                        <Input
                          value={formData.languages || ''}
                          onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium">{employee.languages || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="education" className="p-6 space-y-6 mt-0">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Educational Background
                  </h3>
                  <div className="space-y-4">
                    {/* Elementary */}
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ELEMENTARY</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">School</Label>
                          {isEditing ? (
                            <Input
                              value={formData.elementary_school || ''}
                              onChange={(e) => setFormData({ ...formData, elementary_school: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.elementary_school || '-'}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Year Graduated</Label>
                          {isEditing ? (
                            <Input
                              value={formData.elementary_year || ''}
                              onChange={(e) => setFormData({ ...formData, elementary_year: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.elementary_year || '-'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* High School */}
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">HIGH SCHOOL</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">School</Label>
                          {isEditing ? (
                            <Input
                              value={formData.highschool_school || ''}
                              onChange={(e) => setFormData({ ...formData, highschool_school: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.highschool_school || '-'}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Year Graduated</Label>
                          {isEditing ? (
                            <Input
                              value={formData.highschool_year || ''}
                              onChange={(e) => setFormData({ ...formData, highschool_year: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.highschool_year || '-'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* College */}
                    <div className="p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">COLLEGE</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">School</Label>
                          {isEditing ? (
                            <Input
                              value={formData.college_school || ''}
                              onChange={(e) => setFormData({ ...formData, college_school: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.college_school || '-'}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Year Graduated</Label>
                          {isEditing ? (
                            <Input
                              value={formData.college_year || ''}
                              onChange={(e) => setFormData({ ...formData, college_year: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.college_year || '-'}</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Degree Received</Label>
                          {isEditing ? (
                            <Input
                              value={formData.degree_received || ''}
                              onChange={(e) => setFormData({ ...formData, degree_received: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-sm font-medium">{employee.degree_received || '-'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="selfies" className="p-6 mt-0">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Attendance Selfies
                </h3>
                {loadingSelfies ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : selfies.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No selfies recorded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selfies.map((entry) => (
                      <div key={entry.id} className="space-y-1.5">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                          <img
                            src={entry.selfie_url || ''}
                            alt={`Selfie for ${entry.entry_type}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {entryTypeLabels[entry.entry_type] || entry.entry_type}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(entry.timestamp), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
