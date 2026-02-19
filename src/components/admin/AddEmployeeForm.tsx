import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Plus, Trash2 } from 'lucide-react';

interface EmploymentRecord {
  companyName: string;
  position: string;
  from: string;
  to: string;
}

interface Child {
  name: string;
  dateOfBirth: string;
}

interface AddEmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddEmployeeForm({ onSuccess, onCancel }: AddEmployeeFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Personal Data
  const [formData, setFormData] = useState({
    positionDesired: '',
    applicationDate: new Date().toISOString().split('T')[0],
    firstName: '',
    lastName: '',
    sex: '',
    cityAddress: '',
    provincialAddress: '',
    telephone: '',
    cellphone: '',
    email: '',
    dateOfBirth: '',
    age: '',
    civilStatus: '',
    citizenship: '',
    height: '',
    weight: '',
    religion: '',
    spouseName: '',
    spouseOccupation: '',
    fatherName: '',
    motherName: '',
    parentsOccupation: '',
    parentsAddress: '',
    languages: '',
    emergencyContactName: '',
    emergencyContactAddress: '',
    emergencyContactPhone: '',
    // Educational
    elementarySchool: '',
    elementaryYear: '',
    highschoolSchool: '',
    highschoolYear: '',
    collegeSchool: '',
    collegeYear: '',
    degreeReceived: '',
    specialSkills: '',
    // Work
    department: '',
    position: '',
    hourlyRate: '',
    // Account
    username: '',
    password: '',
    role: 'employee',
  });

  const [children, setChildren] = useState<Child[]>([]);
  const [employmentRecords, setEmploymentRecords] = useState<EmploymentRecord[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate age from DOB
    if (field === 'dateOfBirth' && value) {
      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setFormData((prev) => ({ ...prev, age: age.toString() }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addChild = () => {
    setChildren([...children, { name: '', dateOfBirth: '' }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updated = [...children];
    updated[index][field] = value;
    setChildren(updated);
  };

  const addEmploymentRecord = () => {
    setEmploymentRecords([...employmentRecords, { companyName: '', position: '', from: '', to: '' }]);
  };

  const removeEmploymentRecord = (index: number) => {
    setEmploymentRecords(employmentRecords.filter((_, i) => i !== index));
  };

  const updateEmploymentRecord = (index: number, field: keyof EmploymentRecord, value: string) => {
    const updated = [...employmentRecords];
    updated[index][field] = value;
    setEmploymentRecords(updated);
  };

  const generateEmployeeId = () => {
    return `EMP${Date.now().toString().slice(-6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please fill in all required fields (Name, Email, Password)',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // CRITICAL: Store admin session before creating new user
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) throw new Error('Admin session not found. Please log in again.');

      // Upload photo FIRST while still admin (before creating user)
      let photoUrl = null;
      if (photoFile) {
        const tempId = `temp_${Date.now()}`;
        const fileName = `${tempId}/${Date.now()}.${photoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('employee-photos')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      // Create user account (this will NOT log in as new user with current setup)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Restore admin session immediately after signUp
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });

      if (restoreError) {
        console.error('Failed to restore admin session:', restoreError);
        throw new Error('Session error. Please log in again and retry.');
      }

      // Wait for profile to be created by trigger
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get the profile (now as admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      // Create employee record with all fields (as admin)
      const employeeData = {
        user_id: authData.user.id,
        profile_id: profile?.id,
        employee_id: generateEmployeeId(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.cellphone || null,
        department: formData.department || null,
        position: formData.position || null,
        hourly_rate: parseFloat(formData.hourlyRate) || 0,
        photo_url: photoUrl,
        position_desired: formData.positionDesired || null,
        application_date: formData.applicationDate || null,
        sex: formData.sex || null,
        city_address: formData.cityAddress || null,
        provincial_address: formData.provincialAddress || null,
        telephone: formData.telephone || null,
        date_of_birth: formData.dateOfBirth || null,
        age: formData.age ? parseInt(formData.age) : null,
        civil_status: formData.civilStatus || null,
        citizenship: formData.citizenship || null,
        height: formData.height || null,
        weight: formData.weight || null,
        religion: formData.religion || null,
        spouse_name: formData.spouseName || null,
        spouse_occupation: formData.spouseOccupation || null,
        children: children.length > 0 ? children : [],
        father_name: formData.fatherName || null,
        mother_name: formData.motherName || null,
        parents_occupation: formData.parentsOccupation || null,
        parents_address: formData.parentsAddress || null,
        languages: formData.languages || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_address: formData.emergencyContactAddress || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        elementary_school: formData.elementarySchool || null,
        elementary_year: formData.elementaryYear || null,
        highschool_school: formData.highschoolSchool || null,
        highschool_year: formData.highschoolYear || null,
        college_school: formData.collegeSchool || null,
        college_year: formData.collegeYear || null,
        degree_received: formData.degreeReceived || null,
        special_skills: formData.specialSkills || null,
        employment_records: employmentRecords.length > 0 ? employmentRecords : [],
      };

      const { error: employeeError } = await supabase
        .from('employees')
        .insert(employeeData as any);

      if (employeeError) throw employeeError;

      // Add user role (as admin)
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: formData.role as 'employee' | 'site_admin_officer',
      });

      if (roleError) throw roleError;

      toast({
        title: formData.role === 'site_admin_officer' ? 'SAO Created Successfully' : 'Employee Created Successfully',
        description: `${formData.firstName} ${formData.lastName} can now login with email: ${formData.email}`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* PERSONAL DATA TAB */}
        <TabsContent value="personal" className="space-y-4 mt-4">
          {/* Photo Upload */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar className="w-20 h-20">
              <AvatarImage src={photoPreview || ''} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl">
                {formData.firstName?.[0] || 'E'}{formData.lastName?.[0] || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </div>
              </Label>
              <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Position Desired</Label>
              <Input value={formData.positionDesired} onChange={(e) => handleChange('positionDesired', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Application Date</Label>
              <Input type="date" value={formData.applicationDate} onChange={(e) => handleChange('applicationDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select value={formData.sex} onValueChange={(v) => handleChange('sex', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City Address</Label>
              <Input value={formData.cityAddress} onChange={(e) => handleChange('cityAddress', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Provincial Address</Label>
              <Input value={formData.provincialAddress} onChange={(e) => handleChange('provincialAddress', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input value={formData.telephone} onChange={(e) => handleChange('telephone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cellphone</Label>
              <Input value={formData.cellphone} onChange={(e) => handleChange('cellphone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input value={formData.age} onChange={(e) => handleChange('age', e.target.value)} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Civil Status</Label>
              <Select value={formData.civilStatus} onValueChange={(v) => handleChange('civilStatus', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="Separated">Separated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Citizenship</Label>
              <Input value={formData.citizenship} onChange={(e) => handleChange('citizenship', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Height</Label>
              <Input value={formData.height} onChange={(e) => handleChange('height', e.target.value)} placeholder="e.g., 5'8&quot;" />
            </div>
            <div className="space-y-2">
              <Label>Weight</Label>
              <Input value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} placeholder="e.g., 150 lbs" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Religion</Label>
              <Input value={formData.religion} onChange={(e) => handleChange('religion', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Languages (Spoken and Written)</Label>
            <Input value={formData.languages} onChange={(e) => handleChange('languages', e.target.value)} placeholder="e.g., English, Filipino, Spanish" />
          </div>
        </TabsContent>

        {/* FAMILY TAB */}
        <TabsContent value="family" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Spouse Name</Label>
              <Input value={formData.spouseName} onChange={(e) => handleChange('spouseName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Spouse Occupation</Label>
              <Input value={formData.spouseOccupation} onChange={(e) => handleChange('spouseOccupation', e.target.value)} />
            </div>
          </div>

          {/* Children */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Children</Label>
              <Button type="button" variant="outline" size="sm" onClick={addChild}>
                <Plus className="w-4 h-4 mr-1" /> Add Child
              </Button>
            </div>
            {children.map((child, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input value={child.name} onChange={(e) => updateChild(index, 'name', e.target.value)} />
                </div>
                <div className="w-40 space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input type="date" value={child.dateOfBirth} onChange={(e) => updateChild(index, 'dateOfBirth', e.target.value)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeChild(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Father's Name</Label>
              <Input value={formData.fatherName} onChange={(e) => handleChange('fatherName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mother's Name</Label>
              <Input value={formData.motherName} onChange={(e) => handleChange('motherName', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parents' Occupation</Label>
              <Input value={formData.parentsOccupation} onChange={(e) => handleChange('parentsOccupation', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parents' Address</Label>
              <Input value={formData.parentsAddress} onChange={(e) => handleChange('parentsAddress', e.target.value)} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="font-semibold text-sm">Person to Contact in Case of Emergency</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.emergencyContactAddress} onChange={(e) => handleChange('emergencyContactAddress', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Telephone</Label>
                <Input value={formData.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* EDUCATION TAB */}
        <TabsContent value="education" className="space-y-4 mt-4">
          <h4 className="font-semibold">Educational Attainment</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Elementary School</Label>
              <Input value={formData.elementarySchool} onChange={(e) => handleChange('elementarySchool', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Year Graduated</Label>
              <Input value={formData.elementaryYear} onChange={(e) => handleChange('elementaryYear', e.target.value)} placeholder="e.g., 2010" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>High School</Label>
              <Input value={formData.highschoolSchool} onChange={(e) => handleChange('highschoolSchool', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Year Graduated</Label>
              <Input value={formData.highschoolYear} onChange={(e) => handleChange('highschoolYear', e.target.value)} placeholder="e.g., 2014" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>College</Label>
              <Input value={formData.collegeSchool} onChange={(e) => handleChange('collegeSchool', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Year Graduated</Label>
              <Input value={formData.collegeYear} onChange={(e) => handleChange('collegeYear', e.target.value)} placeholder="e.g., 2018" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Degree Received</Label>
            <Input value={formData.degreeReceived} onChange={(e) => handleChange('degreeReceived', e.target.value)} placeholder="e.g., Bachelor of Science in Computer Science" />
          </div>

          <div className="space-y-2">
            <Label>Special Skills</Label>
            <Textarea value={formData.specialSkills} onChange={(e) => handleChange('specialSkills', e.target.value)} placeholder="List any special skills, certifications, or competencies..." />
          </div>
        </TabsContent>

        {/* EMPLOYMENT TAB */}
        <TabsContent value="employment" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Employment Records</h4>
            <Button type="button" variant="outline" size="sm" onClick={addEmploymentRecord}>
              <Plus className="w-4 h-4 mr-1" /> Add Record
            </Button>
          </div>

          {employmentRecords.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
              No employment records added yet. Click "Add Record" to add work history.
            </p>
          )}

          {employmentRecords.map((record, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Record #{index + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeEmploymentRecord(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Company Name</Label>
                  <Input value={record.companyName} onChange={(e) => updateEmploymentRecord(index, 'companyName', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Position</Label>
                  <Input value={record.position} onChange={(e) => updateEmploymentRecord(index, 'position', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={record.from} onChange={(e) => updateEmploymentRecord(index, 'from', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={record.to} onChange={(e) => updateEmploymentRecord(index, 'to', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t space-y-4">
            <h4 className="font-semibold">Work Assignment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={formData.department} onChange={(e) => handleChange('department', e.target.value)} placeholder="e.g., Engineering" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={formData.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="e.g., Software Developer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hourly Rate ($) *</Label>
              <Input type="number" step="0.01" min="0" value={formData.hourlyRate} onChange={(e) => handleChange('hourlyRate', e.target.value)} required />
            </div>
          </div>
        </TabsContent>

        {/* ACCOUNT TAB */}
        <TabsContent value="account" className="space-y-4 mt-4">
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Account Type</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Select the role for this user account.
            </p>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="site_admin_officer">Site Admin Officer (SAO)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === 'site_admin_officer' 
                  ? 'SAO can manage assigned workers and access the SAO Portal.' 
                  : 'Employee can clock in/out and access the Employee Portal.'}
              </p>
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Login Credentials</h4>
            <p className="text-sm text-muted-foreground mb-4">
              These credentials will be used to login to the {formData.role === 'site_admin_officer' ? 'SAO' : 'Employee'} Portal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email (Username) *</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
                <p className="text-xs text-muted-foreground">Email serves as the username for login</p>
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Minimum 6 characters" required minLength={6} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gradient-primary" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Employee...
            </>
          ) : (
            'Create Employee Account'
          )}
        </Button>
      </div>
    </form>
  );
}
