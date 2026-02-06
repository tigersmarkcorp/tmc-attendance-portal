import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, Search, DollarSign, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface TimesheetWithEmployee {
  id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  total_work_minutes: number;
  total_break_minutes: number;
  status: string;
  hourly_rate: number | null;
  total_pay: number | null;
  employees: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
    employee_id: string;
    hourly_rate: number;
  };
}

export default function Timesheets() {
  const [timesheets, setTimesheets] = useState<TimesheetWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const { data } = await supabase
      .from('timesheets')
      .select(`
        *,
        employees (
          first_name,
          last_name,
          photo_url,
          employee_id,
          hourly_rate
        )
      `)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (data) {
      setTimesheets(data as unknown as TimesheetWithEmployee[]);
    }
    setLoading(false);
  };

  const approveTimesheet = async (timesheetId: string, hourlyRate: number, totalMinutes: number) => {
    setApproving(timesheetId);
    const totalPay = (totalMinutes / 60) * hourlyRate;

    const { error } = await supabase
      .from('timesheets')
      .update({
        status: 'approved',
        hourly_rate: hourlyRate,
        total_pay: totalPay,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', timesheetId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve timesheet',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Approved',
        description: 'Timesheet has been approved successfully',
      });
      fetchTimesheets();
    }
    setApproving(null);
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredTimesheets = timesheets.filter(
    (ts) =>
      ts.employees.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ts.employees.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ts.employees.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = timesheets.filter((ts) => ts.status === 'pending').length;
  const totalPay = timesheets.reduce((sum, ts) => sum + (ts.total_pay || 0), 0);
  const totalHours = timesheets.reduce((sum, ts) => sum + ts.total_work_minutes, 0) / 60;

  return (
    <DashboardLayout title="Timesheets">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl gradient-warning">
                  <FileText className="w-6 h-6 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl gradient-primary">
                  <Clock className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours This Month</p>
                  <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl gradient-success">
                  <DollarSign className="w-6 h-6 text-success-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">₱{totalPay.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Timesheets - {format(new Date(), 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTimesheets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No timesheets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Work Time</TableHead>
                      <TableHead>Break Time</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Pay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTimesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={ts.employees.photo_url || ''} />
                              <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
                                {ts.employees.first_name[0]}
                                {ts.employees.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {ts.employees.first_name} {ts.employees.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {ts.employees.employee_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(ts.date), 'MMM d')}</TableCell>
                        <TableCell>
                          {ts.clock_in_time
                            ? format(new Date(ts.clock_in_time), 'HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {ts.clock_out_time
                            ? format(new Date(ts.clock_out_time), 'HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>{formatMinutes(ts.total_work_minutes)}</TableCell>
                        <TableCell>{formatMinutes(ts.total_break_minutes)}</TableCell>
                        <TableCell>₱{ts.employees.hourly_rate}/hr</TableCell>
                        <TableCell className="font-medium">
                          ₱{(ts.total_pay || (ts.total_work_minutes / 60) * ts.employees.hourly_rate).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ts.status === 'approved' ? 'default' : 'secondary'}
                            className={
                              ts.status === 'approved'
                                ? 'bg-success text-success-foreground'
                                : ''
                            }
                          >
                            {ts.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ts.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                approveTimesheet(
                                  ts.id,
                                  ts.employees.hourly_rate,
                                  ts.total_work_minutes
                                )
                              }
                              disabled={approving === ts.id}
                              className="gradient-success"
                            >
                              {approving === ts.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                          )}
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
