import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarDays, Plus, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type LeaveType = Database['public']['Enums']['leave_type'];
type LeaveStatus = Database['public']['Enums']['leave_status'];

const MAX_PENDING_REQUESTS = 4;

interface LeaveRequest {
  id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
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

export default function SAOLeaveRequest() {
  const { employeeId, loading } = useAuth();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [formData, setFormData] = useState({
    leave_type: '' as LeaveType | '',
    start_date: '',
    end_date: '',
    reason: '',
    undertime_hours: '',
  });

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeInfo();
      fetchLeaveRequests();
    }
  }, [employeeId]);

  const fetchEmployeeInfo = async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from('employees')
      .select('email, first_name, last_name, employee_id, department')
      .eq('id', employeeId)
      .maybeSingle();
    if (data) setEmployeeInfo(data);
  };

  const fetchLeaveRequests = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch leave requests', variant: 'destructive' });
    } else {
      setLeaveRequests(data || []);
    }
  };

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const canSubmitNew = pendingCount < MAX_PENDING_REQUESTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !formData.leave_type) return;

    if (!canSubmitNew) {
      toast({ title: 'Limit Reached', description: `You can only have ${MAX_PENDING_REQUESTS} pending leave requests at a time.`, variant: 'destructive' });
      return;
    }

    if (!formData.reason.trim()) {
      toast({ title: 'Required', description: 'Please provide a reason for your leave/undertime.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('leave_requests').insert({
      employee_id: employeeId,
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason,
      undertime_hours: formData.undertime_hours ? parseFloat(formData.undertime_hours) : null,
    } as any);

    setIsSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to submit leave request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Leave request submitted successfully' });
      setFormData({ leave_type: '', start_date: '', end_date: '', reason: '', undertime_hours: '' });
      setShowForm(false);
      fetchLeaveRequests();
    }
  };

  const handleCancelRequest = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'cancelled' as LeaveStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to cancel leave request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Leave request cancelled' });
      fetchLeaveRequests();
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Leave Requests" portalType="sao">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leave Requests" portalType="sao">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Leave Requests</h2>
            <p className="text-muted-foreground">Submit and manage your leave requests</p>
            {!canSubmitNew && (
              <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                You have reached the maximum of {MAX_PENDING_REQUESTS} pending requests.
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            disabled={!canSubmitNew && !showForm}
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600"
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Cancel' : `New Request (${pendingCount}/${MAX_PENDING_REQUESTS})`}
          </Button>
        </div>

        {showForm && (
          <Card className="border-violet-500/30">
            <CardHeader>
              <CardTitle>Submit Leave Request</CardTitle>
              <CardDescription>Fill out the form to request time off</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auto-filled employee info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo?.email || ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Name <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo ? `${employeeInfo.first_name} ${employeeInfo.last_name}` : ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Number <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo?.employee_id || ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Department <span className="text-destructive">*</span></Label>
                    <Input value={employeeInfo?.department || 'N/A'} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leave Type <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.leave_type}
                      onValueChange={(value) => setFormData({ ...formData, leave_type: value as LeaveType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leave Date Start <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label>Reason for Leave/Undertime <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Provide the reason for your leave or undertime..."
                    rows={3}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting || !formData.leave_type} className="bg-gradient-to-r from-violet-500 to-indigo-500">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
            <CardDescription>Your submitted leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">{request.leave_type} Leave</p>
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                      </p>
                      {request.undertime_hours && (
                        <p className="text-sm text-muted-foreground">Undertime: {request.undertime_hours} hrs</p>
                      )}
                      {request.reason && (
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      )}
                      {request.review_notes && (
                        <p className="text-sm text-muted-foreground italic">Note: {request.review_notes}</p>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => handleCancelRequest(request.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
