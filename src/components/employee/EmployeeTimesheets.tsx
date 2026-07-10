import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, DollarSign, Clock, Loader2 } from 'lucide-react';

interface Timesheet {
  id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  total_work_minutes: number;
  total_break_minutes: number;
  status: string;
  hourly_rate: number | null;
  total_pay: number | null;
}

interface EmployeeTimesheetsProps {
  employeeId: string;
}

export function EmployeeTimesheets({ employeeId }: EmployeeTimesheetsProps) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ hours: 0, earnings: 0 });

  useEffect(() => {
    const fetchTimesheets = async () => {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const { data } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (data) {
        setTimesheets(data);
        const totalMinutes = data.reduce((sum, ts) => sum + (ts.total_work_minutes || 0), 0);
        const totalEarnings = data.reduce((sum, ts) => sum + (ts.total_pay || 0), 0);
        setTotals({
          hours: Math.round((totalMinutes / 60) * 10) / 10,
          earnings: totalEarnings,
        });
      }
      setLoading(false);
    };

    fetchTimesheets();
  }, [employeeId]);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl gradient-primary">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hours This Month</p>
                <p className="text-2xl font-bold">{totals.hours}h</p>
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
                <p className="text-sm text-muted-foreground">Earnings This Month</p>
                <p className="text-2xl font-bold">₱{totals.earnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            My Timesheets - {format(new Date(), 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No timesheets found for this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Work Time</TableHead>
                    <TableHead>Break Time</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell className="font-medium">
                        {format(new Date(ts.date), 'MMM d, yyyy')}
                      </TableCell>
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
                      <TableCell className="font-medium">
                        ₱{(ts.total_pay || 0).toFixed(2)}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
