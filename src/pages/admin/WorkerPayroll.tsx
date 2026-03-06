import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Loader2, 
  DollarSign, 
  Clock, 
  Calendar,
  TrendingUp,
  Banknote,
  HardHat,
  FileText,
  Pencil,
} from 'lucide-react';
import { format, addDays, previousThursday, isThursday, subWeeks, startOfDay, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';

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
  hourly_rate: number | null;
  status: string;
}

interface WorkerTimesheet {
  id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  total_work_minutes: number | null;
  regular_hours: number | null;
  overtime_hours: number | null;
  regular_pay: number | null;
  overtime_pay: number | null;
  total_pay: number | null;
  status: string | null;
}

interface PayPeriod {
  start: Date;
  end: Date;
  label: string;
}

// Helper to get current or recent pay periods (Thursday to next Wednesday)
const getPayPeriods = (count: number = 6): PayPeriod[] => {
  const periods: PayPeriod[] = [];
  const today = startOfDay(new Date());
  
  // Find the most recent Thursday (or today if it's Thursday)
  let currentStart = isThursday(today) ? today : previousThursday(today);
  
  for (let i = 0; i < count; i++) {
    const start = currentStart;
    // End is next Wednesday (6 days from Thursday)
    const end = addDays(start, 6);
    
    periods.push({
      start,
      end,
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
    });
    
    // Move to the previous week's Thursday
    currentStart = subWeeks(currentStart, 1);
  }
  
  return periods;
};

export default function WorkerPayroll() {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [timesheets, setTimesheets] = useState<WorkerTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [payPeriods] = useState<PayPeriod[]>(getPayPeriods(12));
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod>(payPeriods[0]);
  const [editingTimesheet, setEditingTimesheet] = useState<WorkerTimesheet | null>(null);
  const [editForm, setEditForm] = useState({
    clock_in_time: '',
    clock_out_time: '',
    total_work_minutes: 0,
    regular_hours: 0,
    overtime_hours: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workerId) {
      fetchWorkerAndTimesheets();
    }
  }, [workerId, selectedPeriod]);

  const fetchWorkerAndTimesheets = async () => {
    setLoading(true);
    
    // Fetch worker details
    const { data: workerData } = await supabase
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .maybeSingle();

    if (workerData) {
      setWorker(workerData);
    }

    // Fetch timesheets for selected pay period
    const periodStart = format(selectedPeriod.start, 'yyyy-MM-dd');
    const periodEnd = format(selectedPeriod.end, 'yyyy-MM-dd');

    const { data: timesheetData } = await supabase
      .from('worker_timesheets')
      .select('*')
      .eq('worker_id', workerId)
      .gte('date', periodStart)
      .lte('date', periodEnd)
      .order('date', { ascending: false });

    if (timesheetData) {
      setTimesheets(timesheetData);
    }

    setLoading(false);
  };

  const calculateTotals = () => {
    return timesheets.reduce(
      (acc, ts) => ({
        totalHours: acc.totalHours + (ts.total_work_minutes || 0) / 60,
        regularHours: acc.regularHours + (ts.regular_hours || 0),
        overtimeHours: acc.overtimeHours + (ts.overtime_hours || 0),
        regularPay: acc.regularPay + (ts.regular_pay || 0),
        overtimePay: acc.overtimePay + (ts.overtime_pay || 0),
        totalPay: acc.totalPay + (ts.total_pay || 0),
        daysWorked: acc.daysWorked + 1,
      }),
      {
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        regularPay: 0,
        overtimePay: 0,
        totalPay: 0,
        daysWorked: 0,
      }
    );
  };

  const totals = calculateTotals();

  const handleEditTimesheet = (ts: WorkerTimesheet) => {
    setEditingTimesheet(ts);
    setEditForm({
      clock_in_time: ts.clock_in_time ? format(new Date(ts.clock_in_time), "HH:mm") : '',
      clock_out_time: ts.clock_out_time ? format(new Date(ts.clock_out_time), "HH:mm") : '',
      total_work_minutes: ts.total_work_minutes || 0,
      regular_hours: ts.regular_hours || 0,
      overtime_hours: ts.overtime_hours || 0,
    });
  };

  const handleSaveTimesheet = async () => {
    if (!editingTimesheet || !worker) return;
    
    setSaving(true);
    try {
      const hourlyRate = worker.hourly_rate || 0;
      const overtimeMultiplier = 1.5;
      
      // Calculate hours from total_work_minutes
      const totalHours = editForm.total_work_minutes / 60;
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(0, totalHours - 8);
      
      // Calculate pay
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
      const totalPay = regularPay + overtimePay;

      // Build clock in/out timestamps based on the date
      let clockInTime = null;
      let clockOutTime = null;
      
      if (editForm.clock_in_time) {
        const [hours, minutes] = editForm.clock_in_time.split(':').map(Number);
        const clockIn = new Date(editingTimesheet.date);
        clockIn.setHours(hours, minutes, 0, 0);
        clockInTime = clockIn.toISOString();
      }
      
      if (editForm.clock_out_time) {
        const [hours, minutes] = editForm.clock_out_time.split(':').map(Number);
        const clockOut = new Date(editingTimesheet.date);
        clockOut.setHours(hours, minutes, 0, 0);
        clockOutTime = clockOut.toISOString();
      }

      await supabase
        .from('worker_timesheets')
        .update({
          clock_in_time: clockInTime,
          clock_out_time: clockOutTime,
          total_work_minutes: editForm.total_work_minutes,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          regular_pay: regularPay,
          overtime_pay: overtimePay,
          total_pay: totalPay,
        })
        .eq('id', editingTimesheet.id);

      toast({
        title: 'Timesheet Updated',
        description: 'The timesheet has been updated successfully.',
      });

      setEditingTimesheet(null);
      fetchWorkerAndTimesheets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update timesheet.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!worker) return;
    
    setGenerating(true);
    try {
      // Recalculate pay for all timesheets in the period
      const hourlyRate = worker.hourly_rate || 0;
      const overtimeMultiplier = 1.5;
      
      for (const ts of timesheets) {
        const totalHours = (ts.total_work_minutes || 0) / 60;
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(0, totalHours - 8);
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
        const totalPay = regularPay + overtimePay;

        await supabase
          .from('worker_timesheets')
          .update({
            hourly_rate: hourlyRate,
            regular_hours: regularHours,
            overtime_hours: overtimeHours,
            regular_pay: regularPay,
            overtime_pay: overtimePay,
            total_pay: totalPay,
            status: 'approved',
          })
          .eq('id', ts.id);
      }

      toast({
        title: 'Payroll Generated',
        description: `Payroll for ${worker.first_name} ${worker.last_name} has been generated for ${selectedPeriod.label}.`,
      });

      setShowGenerateDialog(false);
      fetchWorkerAndTimesheets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payroll.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Worker Payroll">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!worker) {
    return (
      <DashboardLayout title="Worker Payroll">
        <div className="text-center py-12">
          <HardHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Worker not found</h3>
          <Button onClick={() => navigate('/admin/workers')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Worker Payroll">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/workers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workers
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowGenerateDialog(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={timesheets.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate Payroll
            </Button>
          </div>
        </div>

        {/* Pay Period Selector */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-amber-500" />
              Select Pay Period (Thursday - Wednesday)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {payPeriods.slice(0, 6).map((period, index) => (
                <Button
                  key={index}
                  variant={selectedPeriod.label === period.label ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={selectedPeriod.label === period.label ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Worker Info Card */}
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-amber-500/20">
                <AvatarImage src={worker.photo_url || ''} />
                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-medium">
                  {worker.first_name[0]}{worker.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{worker.first_name} {worker.last_name}</h2>
                <p className="text-muted-foreground">{worker.position || 'No position'} • {worker.department || 'No department'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="font-mono">{worker.worker_id}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Hourly Rate: <span className="font-semibold text-foreground">{formatCurrency(worker.hourly_rate || 0)}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Days Worked</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totals.daysWorked}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-violet-500/5 to-violet-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Hours</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totals.totalHours.toFixed(1)}</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Clock className="w-5 h-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-amber-500/5 to-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overtime Hours</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totals.overtimeHours.toFixed(1)}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Pay</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totals.totalPay)}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pay Breakdown */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-amber-500" />
              Pay Breakdown for {selectedPeriod.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Regular Pay</p>
                <p className="text-xl font-bold">{formatCurrency(totals.regularPay)}</p>
                <p className="text-xs text-muted-foreground mt-1">{totals.regularHours.toFixed(1)} hours × {formatCurrency(worker.hourly_rate || 0)}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10">
                <p className="text-sm text-muted-foreground">Overtime Pay</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(totals.overtimePay)}</p>
                <p className="text-xs text-muted-foreground mt-1">{totals.overtimeHours.toFixed(1)} overtime hours × 1.5x</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-sm text-muted-foreground">Gross Pay</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totals.totalPay)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total for pay period</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheets Table */}
        <Card className="border-0 shadow-soft overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle>Daily Timesheets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {timesheets.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No timesheets for this period</h3>
                <p className="text-sm text-muted-foreground">This worker has no recorded timesheets for {selectedPeriod.label}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">OT Hours</TableHead>
                      <TableHead className="text-right">Regular Pay</TableHead>
                      <TableHead className="text-right">OT Pay</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">
                          {format(new Date(ts.date), 'EEE, MMM d')}
                        </TableCell>
                        <TableCell>
                          {ts.clock_in_time ? format(new Date(ts.clock_in_time), 'h:mm a') : '—'}
                        </TableCell>
                        <TableCell>
                          {ts.clock_out_time ? format(new Date(ts.clock_out_time), 'h:mm a') : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {((ts.total_work_minutes || 0) / 60).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(ts.overtime_hours || 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(ts.regular_pay || 0)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(ts.overtime_pay || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(ts.total_pay || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              ts.status === 'approved' 
                                ? 'bg-success/10 text-success border-success/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }
                          >
                            {ts.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTimesheet(ts)}
                            disabled={ts.status === 'approved'}
                            title={ts.status === 'approved' ? 'Cannot edit approved timesheet' : 'Edit timesheet'}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
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

      {/* Edit Timesheet Dialog */}
      <Dialog open={!!editingTimesheet} onOpenChange={(open) => !open && setEditingTimesheet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              Edit Timesheet
            </DialogTitle>
            <DialogDescription>
              Edit the timesheet entry for {editingTimesheet && format(new Date(editingTimesheet.date), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clock_in_time">Clock In Time</Label>
                <Input
                  id="clock_in_time"
                  type="time"
                  value={editForm.clock_in_time}
                  onChange={(e) => setEditForm({ ...editForm, clock_in_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clock_out_time">Clock Out Time</Label>
                <Input
                  id="clock_out_time"
                  type="time"
                  value={editForm.clock_out_time}
                  onChange={(e) => setEditForm({ ...editForm, clock_out_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_work_minutes">Total Work Minutes</Label>
              <Input
                id="total_work_minutes"
                type="number"
                value={editForm.total_work_minutes}
                onChange={(e) => setEditForm({ ...editForm, total_work_minutes: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Equals {(editForm.total_work_minutes / 60).toFixed(2)} hours
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Calculated Pay (based on {formatCurrency(worker?.hourly_rate || 0)}/hr)</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Regular Hours:</span>{' '}
                  <span className="font-medium">{Math.min(editForm.total_work_minutes / 60, 8).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">OT Hours:</span>{' '}
                  <span className="font-medium">{Math.max(0, editForm.total_work_minutes / 60 - 8).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTimesheet(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTimesheet}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Payroll Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Generate Payroll
            </DialogTitle>
            <DialogDescription>
              This will calculate and finalize payroll for the selected pay period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Pay Period</p>
              <p className="text-lg font-bold">{selectedPeriod.label}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Worker</p>
              <p className="text-lg font-bold">{worker.first_name} {worker.last_name}</p>
              <p className="text-sm text-muted-foreground">Hourly Rate: {formatCurrency(worker.hourly_rate || 0)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold">{totals.totalHours.toFixed(1)}</p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Estimated Pay</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totals.totalPay)}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGeneratePayroll}
              disabled={generating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Payroll
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}