import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Plus, Loader2, Clock, Check, X, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const MAX_PENDING_REQUESTS = 4;

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  review_notes: string | null;
  undertime_hours: number | null;
  created_at: string;
}

interface EmployeeInfo {
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string | null;
}

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
];

export default function LeaveRequestPage() {
  const { employeeId, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    undertime_hours: '',
  });
  const { toast } = useToast();

  const fetchEmployeeInfo = async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from('employees')
      .select('email, first_name, last_name, employee_id, department')
      .eq('id', employeeId)
      .maybeSingle();
    if (data) setEmployeeInfo(data);
  };

  const fetchRequests = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch leave requests', variant: 'destructive' });
      return;
    }

    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeInfo();
      fetchRequests();
    }
  }, [employeeId]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const canSubmitNew = pendingCount < MAX_PENDING_REQUESTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    if (!canSubmitNew) {
      toast({ title: 'Limit Reached', description: `You can only have ${MAX_PENDING_REQUESTS} pending leave requests at a time.`, variant: 'destructive' });
      return;
    }

    if (!formData.reason.trim()) {
      toast({ title: 'Required', description: 'Please provide a reason for your leave/undertime.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('leave_requests').insert({
        employee_id: employeeId,
        leave_type: formData.leave_type as any,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        undertime_hours: formData.undertime_hours ? parseFloat(formData.undertime_hours) : null,
      } as any);

      if (error) throw error;

      toast({ title: 'Success', description: 'Leave request submitted successfully' });
      setShowDialog(false);
      setFormData({ leave_type: '', start_date: '', end_date: '', reason: '', undertime_hours: '' });
      fetchRequests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;

    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to cancel request', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Leave request cancelled' });
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string }> = {
      pending: { className: 'bg-warning/20 text-warning border-warning/30' },
      approved: { className: 'bg-success/20 text-success border-success/30' },
      rejected: { className: 'bg-destructive/20 text-destructive border-destructive/30' },
      cancelled: { className: 'bg-muted text-muted-foreground' },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant="outline" className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    pending: pendingCount,
    approved: requests.filter((r) => r.status === 'approved').length,
    total: requests.length,
  };

  if (authLoading) {
    return (
      <DashboardLayout title="Leave Requests">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeId) {
    return (
      <DashboardLayout title="Leave Requests">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Your employee profile is not set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leave Requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Submit and track your leave requests</p>
            {!canSubmitNew && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                You have reached the maximum of {MAX_PENDING_REQUESTS} pending requests.
              </p>
            )}
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" disabled={!canSubmitNew}>
                <Plus className="w-4 h-4 mr-2" />
                New Request ({pendingCount}/{MAX_PENDING_REQUESTS})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auto-filled employee info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo?.email || ''} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>Employee Name <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo ? `${employeeInfo.first_name} ${employeeInfo.last_name}` : ''} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>Employee Number <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo?.employee_id || ''} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>Department <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo?.department || 'N/A'} disabled className="bg-muted" />
                  </div>
                </div>

                <div>
                  <Label>Leave Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.leave_type}
                    onValueChange={(value) => setFormData({ ...formData, leave_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Leave Date Start <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Leave End Date <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.start_date}
                      required
                    />
                  </div>
                </div>

                {formData.start_date && formData.end_date && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <span className="font-medium">Duration: </span>
                    {differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1}{' '}
                    day(s)
                  </div>
                )}

                <div>
                  <Label>If Undertime, please indicate number of hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.undertime_hours}
                    onChange={(e) => setFormData({ ...formData, undertime_hours: e.target.value })}
                    placeholder="e.g. 2.5"
                  />
                </div>

                <div>
                  <Label>Reason for Leave/Undertime <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Provide the reason for your leave or undertime..."
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !formData.leave_type} className="gradient-primary">
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl gradient-primary">
                  <CalendarDays className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl gradient-warning">
                  <Clock className="w-6 h-6 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending} / {MAX_PENDING_REQUESTS}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl gradient-success">
                  <Check className="w-6 h-6 text-success-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leave requests yet. Click "New Request" to submit one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Undertime Hrs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="capitalize font-medium">
                        {request.leave_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.start_date), 'MMM d')} -{' '}
                        {format(new Date(request.end_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {differenceInDays(
                          new Date(request.end_date),
                          new Date(request.start_date)
                        ) + 1}
                      </TableCell>
                      <TableCell>{request.undertime_hours ?? '-'}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.review_notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(request.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
