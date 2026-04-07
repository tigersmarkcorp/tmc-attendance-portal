import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  User, Briefcase, Phone, MapPin, Calendar, DollarSign, Save, Loader2, Camera, Edit3, X, CheckCircle, XCircle, Shield,
} from 'lucide-react';
import { format } from 'date-fns';

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
  date_of_birth?: string | null;
  sex?: string | null;
  civil_status?: string | null;
  city_address?: string | null;
  provincial_address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  employee_type?: string | null;
  date_hired?: string | null;
  hourly_rate?: number | null;
  sss_number?: string | null;
  tin_id?: string | null;
  pagibig_id?: string | null;
  nbi_id?: string | null;
  philhealth_id?: string | null;
  notes?: string | null;
}

interface WorkerTimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
  selfie_url: string | null;
}

interface WorkerDetailSheetProps {
  worker: Worker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkerUpdated: () => void;
  portalType?: string;
}

export function WorkerDetailSheet({ worker, open, onOpenChange, onWorkerUpdated, portalType }: WorkerDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selfies, setSelfies] = useState<WorkerTimeEntry[]>([]);
  const [loadingSelfies, setLoadingSelfies] = useState(false);
  const [formData, setFormData] = useState<Partial<Worker>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (worker && open) {
      // Fetch full worker data
      fetchFullWorker(worker.id);
      fetchSelfies(worker.id);
    }
  }, [worker, open]);

  // Real-time subscription
  useEffect(() => {
    if (!worker || !open) return;
    const channel = supabase
      .channel(`worker-detail-${worker.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers', filter: `id=eq.${worker.id}` }, () => {
        fetchFullWorker(worker.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_time_entries', filter: `worker_id=eq.${worker.id}` }, () => {
        fetchSelfies(worker.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [worker, open]);

  const fetchFullWorker = async (id: string) => {
    const { data } = await supabase.from('workers').select('*').eq('id', id).single();
    if (data) setFormData(data);
  };

  const fetchSelfies = async (workerId: string) => {
    setLoadingSelfies(true);
    const { data } = await supabase
      .from('worker_time_entries')
      .select('id, entry_type, timestamp, selfie_url')
      .eq('worker_id', workerId)
      .not('selfie_url', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(12);
    if (data) setSelfies(data);
    setLoadingSelfies(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!worker || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingPhoto(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `workers/${worker.id}/profile.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('employee-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Error', description: 'Failed to upload photo.', variant: 'destructive' });
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('employee-photos').getPublicUrl(filePath);
    const photo_url = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('workers')
      .update({ photo_url })
      .eq('id', worker.id);

    setUploadingPhoto(false);
    if (updateError) {
      toast({ title: 'Error', description: 'Failed to update photo URL.', variant: 'destructive' });
    } else {
      setFormData({ ...formData, photo_url });
      toast({ title: 'Success', description: 'Profile photo updated.' });
      onWorkerUpdated();
    }
  };

  const handleSave = async () => {
    if (!worker) return;
    setSaving(true);

    const { error } = await supabase
      .from('workers')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        department: formData.department,
        position: formData.position,
        hourly_rate: formData.hourly_rate,
        status: formData.status,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        civil_status: formData.civil_status,
        city_address: formData.city_address,
        provincial_address: formData.provincial_address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        employee_type: formData.employee_type,
        date_hired: formData.date_hired,
        sss_number: formData.sss_number,
        tin_id: formData.tin_id,
        pagibig_id: formData.pagibig_id,
        nbi_id: formData.nbi_id,
        philhealth_id: formData.philhealth_id,
        notes: formData.notes,
      })
      .eq('id', worker.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update worker.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Worker information updated.' });
      setIsEditing(false);
      onWorkerUpdated();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!worker) return;
    const { error } = await supabase.from('workers').update({ status: newStatus }).eq('id', worker.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    } else {
      setFormData({ ...formData, status: newStatus });
      toast({ title: 'Status Updated', description: `Worker is now ${newStatus}.` });
      onWorkerUpdated();
    }
  };

  const entryTypeLabels: Record<string, string> = {
    clock_in: 'Clock In', clock_out: 'Clock Out', break_start: 'Break Start', break_end: 'Break End',
  };

  if (!worker) return null;
  const currentStatus = (formData.status as string) || worker.status;

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    active: { icon: CheckCircle, color: 'bg-success text-success-foreground', label: 'Active' },
    inactive: { icon: XCircle, color: 'bg-muted text-muted-foreground', label: 'Inactive' },
  };
  const StatusIcon = statusConfig[currentStatus]?.icon || CheckCircle;

  const EditableField = ({ label, field, type = 'text' }: { label: string; field: keyof Worker; type?: string }) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {isEditing ? (
        <Input
          type={type}
          value={(formData[field] as string) || ''}
          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
          className="mt-1"
        />
      ) : (
        <p className="text-sm font-medium">{(formData[field] as string) || '-'}</p>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                  <AvatarImage src={formData.photo_url || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-2xl font-bold">
                    {worker.first_name[0]}{worker.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-foreground">{formData.first_name || worker.first_name} {formData.last_name || worker.last_name}</h2>
                  <Badge className={statusConfig[currentStatus]?.color || ''}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[currentStatus]?.label || currentStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{formData.position || 'No Position'}</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {worker.worker_id}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Select value={currentStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant={isEditing ? 'default' : 'outline'} size="sm" onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <><Save className="w-4 h-4 mr-1" />Save</> : <><Edit3 className="w-4 h-4 mr-1" />Edit</>}
              </Button>
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); if (worker) fetchFullWorker(worker.id); }}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
                <TabsTrigger value="info" className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none">
                  <User className="w-4 h-4 mr-2" />Personal
                </TabsTrigger>
                <TabsTrigger value="employment" className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none">
                  <Briefcase className="w-4 h-4 mr-2" />Employment
                </TabsTrigger>
                <TabsTrigger value="gov" className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none">
                  <Shield className="w-4 h-4 mr-2" />Gov IDs
                </TabsTrigger>
                {portalType !== 'encoder' && (
                <TabsTrigger value="selfies" className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none">
                  <Camera className="w-4 h-4 mr-2" />Selfies
                </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="info" className="p-6 space-y-6 mt-0">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-500" />Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="First Name" field="first_name" />
                    <EditableField label="Last Name" field="last_name" />
                    <EditableField label="Date of Birth" field="date_of_birth" type="date" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Sex</Label>
                      {isEditing ? (
                        <Select value={formData.sex || ''} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{formData.sex || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Civil Status</Label>
                      {isEditing ? (
                        <Select value={formData.civil_status || ''} onValueChange={(v) => setFormData({ ...formData, civil_status: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                            <SelectItem value="separated">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm font-medium">{formData.civil_status || '-'}</p>
                      )}
                    </div>
                    <EditableField label="Email" field="email" type="email" />
                    <EditableField label="Phone" field="phone" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />Address
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <EditableField label="City Address" field="city_address" />
                    <EditableField label="Provincial Address" field="provincial_address" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="Contact Name" field="emergency_contact_name" />
                    <EditableField label="Contact Phone" field="emergency_contact_phone" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="p-6 space-y-6 mt-0">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-500" />Employment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="Department" field="department" />
                    <EditableField label="Position" field="position" />
                    <EditableField label="Employee Type" field="employee_type" />
                    <EditableField label="Date Hired" field="date_hired" type="date" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Hourly Rate</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={formData.hourly_rate ?? ''}
                          onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formData.hourly_rate?.toFixed(2) ?? '0.00'}/hr
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium">{formData.notes || '-'}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="gov" className="p-6 space-y-6 mt-0">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />Government IDs
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="SSS Number" field="sss_number" />
                    <EditableField label="TIN ID" field="tin_id" />
                    <EditableField label="Pag-IBIG ID" field="pagibig_id" />
                    <EditableField label="PhilHealth ID" field="philhealth_id" />
                    <EditableField label="NBI ID" field="nbi_id" />
                  </div>
                </div>
              </TabsContent>

              {portalType !== 'encoder' && (
              <TabsContent value="selfies" className="p-6 mt-0">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />Recent Attendance Selfies
                </h3>
                {loadingSelfies ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
                ) : selfies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No selfies recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {selfies.map((entry) => (
                      <div key={entry.id} className="relative group rounded-lg overflow-hidden border border-border">
                        <img src={entry.selfie_url!} alt="Selfie" className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-[10px] text-white font-medium">{entryTypeLabels[entry.entry_type] || entry.entry_type}</p>
                          <p className="text-[9px] text-white/70">{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              )}
            </Tabs>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
