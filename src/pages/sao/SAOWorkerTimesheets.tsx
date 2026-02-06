import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  ArrowLeft, 
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

interface Worker {
  id: string;
  worker_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  hourly_rate: number;
}

interface Timesheet {
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

export default function SAOWorkerTimesheets() {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { employeeId, loading: authLoading } = useAuth();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerId && employeeId) {
      fetchWorkerAndTimesheets();
    }
  }, [workerId, employeeId]);

  const fetchWorkerAndTimesheets = async () => {
    // Fetch worker
    const { data: workerData, error: workerError } = await supabase
      .from('workers')
      .select('id, worker_id, first_name, last_name, photo_url, hourly_rate')
      .eq('id', workerId)
      .eq('assigned_sao_id', employeeId)
      .single();

    if (workerError || !workerData) {
      navigate('/sao/workers');
      return;
    }

    setWorker(workerData);

    // Fetch timesheets for the last 2 months
    const start = startOfMonth(subMonths(new Date(), 1));
    const end = endOfMonth(new Date());

    const { data: timesheetData } = await supabase
      .from('worker_timesheets')
      .select('*')
      .eq('worker_id', workerId)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (timesheetData) {
      setTimesheets(timesheetData);
    }

    setLoading(false);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '—';
    return format(new Date(timestamp), 'h:mm a');
  };

  const formatHours = (minutes: number | null) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate totals
  const totals = timesheets.reduce((acc, ts) => ({
    totalMinutes: acc.totalMinutes + (ts.total_work_minutes || 0),
    regularHours: acc.regularHours + (ts.regular_hours || 0),
    overtimeHours: acc.overtimeHours + (ts.overtime_hours || 0),
    totalPay: acc.totalPay + (ts.total_pay || 0)
  }), { totalMinutes: 0, regularHours: 0, overtimeHours: 0, totalPay: 0 });

  if (authLoading || loading) {
    return (
      <DashboardLayout title="Worker Timesheets" portalType="sao">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!worker) {
    return null;
  }

  return (
    <DashboardLayout title="Worker Timesheets" portalType="sao">
      <div className="space-y-6">
        {/* Back Button & Worker Info */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/sao/workers')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={worker.photo_url || ''} />
              <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                {worker.first_name[0]}{worker.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{worker.first_name} {worker.last_name}</h2>
              <p className="text-sm text-muted-foreground">{worker.worker_id}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Days Worked</p>
                  <p className="text-xl font-bold">{timesheets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                  <p className="text-xl font-bold">{formatHours(totals.totalMinutes)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overtime</p>
                  <p className="text-xl font-bold">{totals.overtimeHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pay</p>
                  <p className="text-xl font-bold">{formatCurrency(totals.totalPay)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timesheets Table */}
        <Card className="border-violet-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-500" />
              Timesheet Records
            </CardTitle>
            <CardDescription>
              Daily attendance and work hours for the past 2 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timesheets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No timesheets yet</h3>
                <p className="text-sm text-muted-foreground">
                  Timesheets will appear here once the worker clocks in.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Regular</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell className="font-medium">
                          {format(new Date(ts.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{formatTime(ts.clock_in_time)}</TableCell>
                        <TableCell>{formatTime(ts.clock_out_time)}</TableCell>
                        <TableCell>{formatHours(ts.total_work_minutes)}</TableCell>
                        <TableCell>{(ts.regular_hours || 0).toFixed(1)}h</TableCell>
                        <TableCell>
                          {(ts.overtime_hours || 0) > 0 ? (
                            <span className="text-amber-500">+{(ts.overtime_hours || 0).toFixed(1)}h</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              ts.status === 'approved' 
                                ? 'bg-success/10 text-success border-success/20'
                                : ts.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {ts.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {ts.status || 'pending'}
                          </Badge>
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
    </DashboardLayout>
  );
}
