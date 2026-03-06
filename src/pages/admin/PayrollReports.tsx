import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, FileText, Plus, Eye, Loader2, TrendingUp, Users, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

interface PayrollReport {
  id: string;
  report_period_start: string;
  report_period_end: string;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_regular_pay: number;
  total_overtime_pay: number;
  total_gross_pay: number;
  employee_count: number;
  status: string;
  created_at: string;
}

interface ReportItem {
  id: string;
  employee_id: string;
  regular_hours: number;
  overtime_hours: number;
  double_overtime_hours: number;
  hourly_rate: number;
  regular_pay: number;
  overtime_pay: number;
  double_overtime_pay: number;
  gross_pay: number;
  days_worked: number;
  employee?: {
    first_name: string;
    last_name: string;
    department: string | null;
  };
}

export default function PayrollReports() {
  const [reports, setReports] = useState<PayrollReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PayrollReport | null>(null);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { toast } = useToast();

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('payroll_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch reports', variant: 'destructive' });
      return;
    }

    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Fetch all active employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, hourly_rate, department')
        .eq('status', 'active');

      if (!employees || employees.length === 0) {
        throw new Error('No active employees found');
      }

      // Fetch timesheets for the period
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('*')
        .gte('date', periodStart)
        .lte('date', periodEnd);

      // Fetch overtime settings
      const { data: settings } = await supabase
        .from('overtime_settings')
        .select('*')
        .limit(1)
        .single();

      const regularHoursPerDay = settings?.regular_hours_per_day || 8;
      const overtimeMultiplier = settings?.overtime_multiplier || 1.5;
      const doubleOvertimeMultiplier = settings?.double_overtime_multiplier || 2.0;
      const doubleOvertimeThreshold = settings?.double_overtime_threshold_hours || 12;

      let totalRegularHours = 0;
      let totalOvertimeHours = 0;
      let totalRegularPay = 0;
      let totalOvertimePay = 0;
      let totalGrossPay = 0;

      const reportItems: Omit<ReportItem, 'id' | 'employee'>[] = [];

      for (const emp of employees) {
        const empTimesheets = timesheets?.filter((t) => t.employee_id === emp.id) || [];
        
        let empRegularHours = 0;
        let empOvertimeHours = 0;
        let empDoubleOvertimeHours = 0;

        for (const ts of empTimesheets) {
          const workedHours = (ts.total_work_minutes || 0) / 60;
          
          if (workedHours <= regularHoursPerDay) {
            empRegularHours += workedHours;
          } else if (workedHours <= doubleOvertimeThreshold) {
            empRegularHours += regularHoursPerDay;
            empOvertimeHours += workedHours - regularHoursPerDay;
          } else {
            empRegularHours += regularHoursPerDay;
            empOvertimeHours += doubleOvertimeThreshold - regularHoursPerDay;
            empDoubleOvertimeHours += workedHours - doubleOvertimeThreshold;
          }
        }

        const empRegularPay = empRegularHours * emp.hourly_rate;
        const empOvertimePay = empOvertimeHours * emp.hourly_rate * overtimeMultiplier;
        const empDoubleOvertimePay = empDoubleOvertimeHours * emp.hourly_rate * doubleOvertimeMultiplier;
        const empGrossPay = empRegularPay + empOvertimePay + empDoubleOvertimePay;

        totalRegularHours += empRegularHours;
        totalOvertimeHours += empOvertimeHours + empDoubleOvertimeHours;
        totalRegularPay += empRegularPay;
        totalOvertimePay += empOvertimePay + empDoubleOvertimePay;
        totalGrossPay += empGrossPay;

        reportItems.push({
          employee_id: emp.id,
          regular_hours: Math.round(empRegularHours * 100) / 100,
          overtime_hours: Math.round(empOvertimeHours * 100) / 100,
          double_overtime_hours: Math.round(empDoubleOvertimeHours * 100) / 100,
          hourly_rate: emp.hourly_rate,
          regular_pay: Math.round(empRegularPay * 100) / 100,
          overtime_pay: Math.round(empOvertimePay * 100) / 100,
          double_overtime_pay: Math.round(empDoubleOvertimePay * 100) / 100,
          gross_pay: Math.round(empGrossPay * 100) / 100,
          days_worked: empTimesheets.length,
        });
      }

      // Create the report
      const { data: report, error: reportError } = await supabase
        .from('payroll_reports')
        .insert({
          report_period_start: periodStart,
          report_period_end: periodEnd,
          total_regular_hours: Math.round(totalRegularHours * 100) / 100,
          total_overtime_hours: Math.round(totalOvertimeHours * 100) / 100,
          total_regular_pay: Math.round(totalRegularPay * 100) / 100,
          total_overtime_pay: Math.round(totalOvertimePay * 100) / 100,
          total_gross_pay: Math.round(totalGrossPay * 100) / 100,
          employee_count: employees.length,
          status: 'completed',
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Insert report items
      const itemsToInsert = reportItems.map((item) => ({
        ...item,
        report_id: report.id,
      }));

      const { error: itemsError } = await supabase
        .from('payroll_report_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Payroll report generated successfully' });
      setShowGenerate(false);
      fetchReports();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const viewReportDetails = async (report: PayrollReport) => {
    setSelectedReport(report);
    setLoadingItems(true);

    const { data } = await supabase
      .from('payroll_report_items')
      .select(`
        *,
        employee:employees(first_name, last_name, department)
      `)
      .eq('report_id', report.id)
      .order('gross_pay', { ascending: false });

    setReportItems(data || []);
    setLoadingItems(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <DashboardLayout title="Payroll Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Generate and view payroll reports with overtime calculations</p>
          <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period Start</Label>
                    <Input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Period End</Label>
                    <Input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-2">Overtime Calculation:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Regular hours: Up to 8 hours/day at 1x rate</li>
                    <li>• Overtime: 8-12 hours/day at 1.5x rate</li>
                    <li>• Double overtime: 12+ hours/day at 2x rate</li>
                  </ul>
                </div>
                <Button
                  onClick={generateReport}
                  disabled={generating}
                  className="w-full gradient-primary"
                >
                  {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats from most recent report */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-primary">
                    <DollarSign className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Latest Gross Pay</p>
                    <p className="text-2xl font-bold">{formatCurrency(reports[0].total_gross_pay)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-success">
                    <Clock className="w-6 h-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Regular Hours</p>
                    <p className="text-2xl font-bold">{reports[0].total_regular_hours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl gradient-warning">
                    <TrendingUp className="w-6 h-6 text-warning-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overtime Hours</p>
                    <p className="text-2xl font-bold">{reports[0].total_overtime_hours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-info">
                    <Users className="w-6 h-6 text-info-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employees</p>
                    <p className="text-2xl font-bold">{reports[0].employee_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Reports History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payroll reports generated yet. Click "Generate Report" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Regular Hours</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead>Regular Pay</TableHead>
                    <TableHead>Overtime Pay</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {format(new Date(report.report_period_start), 'MMM d')} -{' '}
                        {format(new Date(report.report_period_end), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{report.employee_count}</TableCell>
                      <TableCell>{report.total_regular_hours}h</TableCell>
                      <TableCell>{report.total_overtime_hours}h</TableCell>
                      <TableCell>{formatCurrency(report.total_regular_pay)}</TableCell>
                      <TableCell>{formatCurrency(report.total_overtime_pay)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(report.total_gross_pay)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/20 text-success">
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewReportDetails(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Payroll Report:{' '}
              {selectedReport &&
                `${format(new Date(selectedReport.report_period_start), 'MMM d')} - ${format(
                  new Date(selectedReport.report_period_end),
                  'MMM d, yyyy'
                )}`}
            </DialogTitle>
          </DialogHeader>
          {loadingItems ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gross Pay</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(selectedReport?.total_gross_pay || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-xl font-bold">
                    {(selectedReport?.total_regular_hours || 0) +
                      (selectedReport?.total_overtime_hours || 0)}
                    h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Pay</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(selectedReport?.total_overtime_pay || 0)}
                  </p>
                </div>
              </div>

              {/* Employee Breakdown */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Regular</TableHead>
                    <TableHead>OT</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Gross Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.employee?.first_name} {item.employee?.last_name}
                      </TableCell>
                      <TableCell>{item.employee?.department || '-'}</TableCell>
                      <TableCell>{item.days_worked}</TableCell>
                      <TableCell>{item.regular_hours}h</TableCell>
                      <TableCell>
                        {item.overtime_hours + item.double_overtime_hours}h
                      </TableCell>
                      <TableCell>{formatCurrency(item.hourly_rate)}/hr</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.gross_pay)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}