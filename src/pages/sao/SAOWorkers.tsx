import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { WorkerClockWidget } from '@/components/sao/WorkerClockWidget';
import { 
  Loader2, 
  Search, 
  HardHat, 
  Users, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin,
  Eye,
  Calendar,
  CreditCard,
  User,
  Shield,
  Briefcase,
  AlertCircle,
  Clock,
  FileText,
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
  city_address: string | null;
  provincial_address: string | null;
  date_of_birth: string | null;
  date_hired: string | null;
  sex: string | null;
  civil_status: string | null;
  employee_type: string | null;
  sss_number: string | null;
  tin_id: string | null;
  pagibig_id: string | null;
  philhealth_id: string | null;
  nbi_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

export default function SAOWorkers() {
  const navigate = useNavigate();
  const { employeeId, loading: authLoading } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (employeeId) {
      fetchAssignedWorkers();
    }
  }, [employeeId]);

  const fetchAssignedWorkers = async () => {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('assigned_sao_id', employeeId)
      .order('created_at', { ascending: false });

    if (data) {
      setWorkers(data);
    }
    setLoading(false);
  };

  const handleClockAction = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setSheetOpen(true);
  };

  const filteredWorkers = workers.filter((worker) =>
    worker.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.worker_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: workers.length,
    active: workers.filter((w) => w.status === 'active').length,
  };

  if (authLoading) {
    return (
      <DashboardLayout title="My Workers" portalType="sao">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: any }) => (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="My Workers" portalType="sao">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                  <HardHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Workers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Workers</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Workers List */}
        <Card className="border-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-violet-500" />
              Assigned Workers
            </CardTitle>
            <CardDescription>
              Workers assigned to you by the administrator
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No workers assigned</h3>
                <p className="text-sm text-muted-foreground">
                  Workers will appear here once the administrator assigns them to you.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((worker) => (
                      <TableRow key={worker.id} className="group hover:bg-violet-500/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={worker.photo_url || ''} />
                              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                {worker.first_name[0]}{worker.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{worker.first_name} {worker.last_name}</p>
                              {worker.city_address && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {worker.city_address.length > 30 
                                    ? worker.city_address.substring(0, 30) + '...' 
                                    : worker.city_address}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 text-xs rounded bg-muted font-mono">
                            {worker.worker_id}
                          </code>
                        </TableCell>
                        <TableCell>{worker.position || '—'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {worker.phone && (
                              <p className="text-xs flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {worker.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={worker.status === 'active' 
                              ? 'bg-success/10 text-success border-success/20' 
                              : 'bg-muted text-muted-foreground'
                            }
                          >
                            {worker.status === 'active' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {worker.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employeeId && (
                            <WorkerClockWidget
                              key={`${worker.id}-${refreshKey}`}
                              worker={worker}
                              saoId={employeeId}
                              onClockAction={handleClockAction}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/sao/workers/${worker.id}/timesheets`)}
                              className="gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Timesheets
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewWorker(worker)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Worker Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedWorker && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedWorker.photo_url || ''} />
                    <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xl">
                      {selectedWorker.first_name[0]}{selectedWorker.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-left">
                      {selectedWorker.first_name} {selectedWorker.last_name}
                    </SheetTitle>
                    <SheetDescription className="text-left">
                      <code className="text-xs">{selectedWorker.worker_id}</code>
                    </SheetDescription>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${selectedWorker.status === 'active' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {selectedWorker.status === 'active' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {selectedWorker.status}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <Separator className="my-4" />

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="work">Work</TabsTrigger>
                  <TabsTrigger value="ids">Gov IDs</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={User} label="Full Name" value={`${selectedWorker.first_name} ${selectedWorker.last_name}`} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={selectedWorker.date_of_birth ? format(new Date(selectedWorker.date_of_birth), 'MMM d, yyyy') : null} />
                    <InfoRow label="Sex" value={selectedWorker.sex} />
                    <InfoRow label="Civil Status" value={selectedWorker.civil_status} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Address
                    </h4>
                    <InfoRow label="City Address" value={selectedWorker.city_address} />
                    <InfoRow label="Provincial Address" value={selectedWorker.provincial_address} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Contact
                    </h4>
                    <InfoRow icon={Phone} label="Phone" value={selectedWorker.phone} />
                    <InfoRow icon={Mail} label="Email" value={selectedWorker.email} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Emergency Contact
                    </h4>
                    <InfoRow label="Name" value={selectedWorker.emergency_contact_name} />
                    <InfoRow icon={Phone} label="Phone" value={selectedWorker.emergency_contact_phone} />
                  </div>
                </TabsContent>

                <TabsContent value="work" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={Briefcase} label="Position" value={selectedWorker.position} />
                    <InfoRow label="Department/Site" value={selectedWorker.department} />
                    <InfoRow label="Employee Type" value={selectedWorker.employee_type} />
                    <InfoRow icon={Calendar} label="Date Hired" value={selectedWorker.date_hired ? format(new Date(selectedWorker.date_hired), 'MMM d, yyyy') : null} />
                  </div>

                  {selectedWorker.notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Notes</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {selectedWorker.notes}
                        </p>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="ids" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border bg-card">
                      <InfoRow icon={CreditCard} label="SSS Number" value={selectedWorker.sss_number} />
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <InfoRow icon={CreditCard} label="TIN ID" value={selectedWorker.tin_id} />
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <InfoRow icon={CreditCard} label="Pag-IBIG ID" value={selectedWorker.pagibig_id} />
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <InfoRow icon={CreditCard} label="PhilHealth ID" value={selectedWorker.philhealth_id} />
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <InfoRow icon={Shield} label="NBI Clearance ID" value={selectedWorker.nbi_id} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
