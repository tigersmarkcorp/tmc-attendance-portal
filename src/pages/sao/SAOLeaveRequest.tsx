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
import { Loader2, CalendarDays, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type LeaveType = Database['public']['Enums']['leave_type'];
type LeaveStatus = Database['public']['Enums']['leave_status'];

interface LeaveRequest {
  id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  review_notes: string | null;
  created_at: string;
}

export default function SAOLeaveRequest() {
  const { employeeId, loading } = useAuth();
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '' as LeaveType | '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    if (employeeId) {
      fetchLeaveRequests();
    }
  }, [employeeId]);

  const fetchLeaveRequests = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leave requests',
        variant: 'destructive',
      });
    } else {
      setLeaveRequests(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !formData.leave_type) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('leave_requests').insert({
      employee_id: employeeId,
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit leave request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
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
      toast({
        title: 'Error',
        description: 'Failed to cancel leave request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Leave request cancelled',
      });
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
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600"
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? 'Cancel' : 'New Request'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select
                      value={formData.leave_type}
                      onValueChange={(value) => setFormData({ ...formData, leave_type: value as LeaveType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Enter reason for leave request..."
                    rows={3}
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
