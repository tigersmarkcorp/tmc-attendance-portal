import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

const workerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  employee_type: z.string().optional(),
  hourly_rate: z.coerce.number().min(0, 'Must be a positive number').optional(),
  date_of_birth: z.string().optional(),
  date_hired: z.string().optional(),
  sex: z.string().optional(),
  civil_status: z.string().optional(),
  city_address: z.string().optional(),
  provincial_address: z.string().optional(),
  sss_number: z.string().optional(),
  tin_id: z.string().optional(),
  pagibig_id: z.string().optional(),
  nbi_id: z.string().optional(),
  philhealth_id: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type WorkerFormValues = z.infer<typeof workerSchema>;

interface AddWorkerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddWorkerForm({ onSuccess, onCancel }: AddWorkerFormProps) {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<WorkerFormValues>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      employee_type: '',
      hourly_rate: 0,
      date_of_birth: '',
      date_hired: '',
      sex: '',
      civil_status: '',
      city_address: '',
      provincial_address: '',
      sss_number: '',
      tin_id: '',
      pagibig_id: '',
      nbi_id: '',
      philhealth_id: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: '',
    },
  });

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

  const generateWorkerId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `WKR-${timestamp}-${random}`;
  };

  const onSubmit = async (values: WorkerFormValues) => {
    setLoading(true);
    try {
      const workerId = generateWorkerId();

      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        const fileName = `workers/${workerId}/${Date.now()}.${photoFile.name.split('.').pop()}`;
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

      const { error } = await supabase.from('workers').insert({
        worker_id: workerId,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email || null,
        phone: values.phone || null,
        position: values.position || null,
        department: values.department || null,
        employee_type: values.employee_type || null,
        hourly_rate: values.hourly_rate || 0,
        date_of_birth: values.date_of_birth || null,
        date_hired: values.date_hired || null,
        sex: values.sex || null,
        civil_status: values.civil_status || null,
        city_address: values.city_address || null,
        provincial_address: values.provincial_address || null,
        sss_number: values.sss_number || null,
        tin_id: values.tin_id || null,
        pagibig_id: values.pagibig_id || null,
        nbi_id: values.nbi_id || null,
        philhealth_id: values.philhealth_id || null,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        notes: values.notes || null,
        photo_url: photoUrl,
      });

      if (error) throw error;

      toast({
        title: 'Worker Added',
        description: `${values.first_name} ${values.last_name} has been added successfully.`,
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add worker.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const firstName = form.watch('first_name');
  const lastName = form.watch('last_name');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="government">Government IDs</TabsTrigger>
            <TabsTrigger value="work">Work Details</TabsTrigger>
          </TabsList>

          {/* PERSONAL INFO TAB */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            {/* Photo Upload */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Avatar className="w-20 h-20">
                <AvatarImage src={photoPreview || ''} />
                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xl">
                  {firstName?.[0] || 'W'}{lastName?.[0] || 'K'}
                </AvatarFallback>
              </Avatar>
              <div>
                <label htmlFor="worker-photo" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </div>
                </label>
                <input 
                  id="worker-photo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+63 912 345 6789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="civil_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civil Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="city_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Complete address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact person" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+63 912 345 6789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* GOVERNMENT IDs TAB */}
          <TabsContent value="government" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sss_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SSS Number</FormLabel>
                    <FormControl>
                      <Input placeholder="XX-XXXXXXX-X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tin_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TIN ID</FormLabel>
                    <FormControl>
                      <Input placeholder="XXX-XXX-XXX-XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pagibig_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pag-IBIG ID</FormLabel>
                    <FormControl>
                      <Input placeholder="XXXX-XXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="philhealth_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PhilHealth ID</FormLabel>
                    <FormControl>
                      <Input placeholder="XX-XXXXXXXXX-X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nbi_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NBI Clearance ID</FormLabel>
                  <FormControl>
                    <Input placeholder="NBI Clearance Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* WORK DETAILS TAB */}
          <TabsContent value="work" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department / Site</FormLabel>
                    <FormControl>
                      <Input placeholder="Site A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Construction Worker" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="contractual">Contractual</SelectItem>
                        <SelectItem value="probationary">Probationary</SelectItem>
                        <SelectItem value="project-based">Project-Based</SelectItem>
                        <SelectItem value="seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (₱)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_hired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Hired</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes about the worker..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Worker
          </Button>
        </div>
      </form>
    </Form>
  );
}
