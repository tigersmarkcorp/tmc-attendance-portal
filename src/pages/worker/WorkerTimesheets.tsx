import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

export default function WorkerTimesheets() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      const { data: w } = await supabase.from('workers').select('id').eq('user_id', user.id).maybeSingle();
      if (!w) { setLoading(false); return; }
      const { data } = await supabase.from('worker_timesheets')
        .select('*').eq('worker_id', w.id).order('date', { ascending: false }).limit(100);
      setRows(data || []);
      setLoading(false);
    };
    run();
  }, [user]);

  return (
    <DashboardLayout title="My Timesheets" portalType="worker">
      <Card>
        <CardHeader><CardTitle>Timesheet History</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No timesheets yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>OT</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{format(new Date(r.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{r.clock_in_time ? format(new Date(r.clock_in_time), 'hh:mm a') : '—'}</TableCell>
                    <TableCell>{r.clock_out_time ? format(new Date(r.clock_out_time), 'hh:mm a') : '—'}</TableCell>
                    <TableCell>{r.regular_hours ?? 0}h</TableCell>
                    <TableCell>{r.overtime_hours ?? 0}h</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(r.total_pay || 0)}</TableCell>
                    <TableCell><Badge variant="outline">{r.status || 'pending'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
